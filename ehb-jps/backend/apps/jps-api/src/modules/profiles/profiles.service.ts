import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './profile.schema';
import { ProfileStatus } from '@ehb-jps/types';
import { PssClientService } from '../pss-client/pss-client.service';
import { JpsProfilePublicDto, toJpsProfilePublic } from './profile-public.dto';
import { UsersService } from '../users/users.service';

// ── State machine ─────────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<ProfileStatus, ProfileStatus[]> = {
  draft: ['submitted'],
  submitted: ['under_review'],
  under_review: ['approved', 'rejected', 'resubmit_required'],
  approved: [],
  rejected: [],
  resubmit_required: ['submitted'],
};

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    private readonly pssClient: PssClientService,
    private readonly usersService: UsersService,
  ) {}

  private baseQuery(userId: string) {
    return { user_id: userId, deleted_at: null };
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 20,
    search?: string,
    role?: string,
    status?: string,
  ) {
    const filter: Record<string, unknown> = this.baseQuery(userId);
    if (search) filter['display_name'] = { $regex: search, $options: 'i' };
    if (role) filter['role'] = role;
    if (status) filter['status'] = status;

    const [profiles, total] = await Promise.all([
      this.profileModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.profileModel.countDocuments(filter),
    ]);

    return { profiles, total, page, limit, has_more: total > page * limit };
  }

  /**
   * Service-to-service read of a single profile, returning ONLY the
   * buyer-safe fields. Used by other EHB platforms (e.g. GoSellr) to
   * render an "owner" card next to a product or listing.
   *
   * No CNIC, no full address, no PSS internal IDs.
   * 404 if not found or soft-deleted.
   */
  async findPublic(id: string): Promise<JpsProfilePublicDto> {
    const profile = await this.profileModel
      .findOne({ _id: id, deleted_at: null })
      .exec();
    if (!profile) throw new NotFoundException('Profile not found');
    return toJpsProfilePublic(profile);
  }


  /**
   * Service-to-service lookup: find a user's profiles by email.
   * Used by other EHB platforms (e.g. GoSellr) to resolve which JPS profile
   * belongs to a given user without sharing a JWT secret. Filters by
   * (platform, role) when supplied.
   *
   * Returns an array (empty if no JPS user exists for the email yet).
   * Excludes soft-deleted profiles.
   */
  async findEligibleByEmail(
    email: string,
    platform?: string,
    role?: string,
  ): Promise<Array<Record<string, unknown>>> {
    this.logger.log(`[svc-lookup] email="${email}" platform="${platform ?? '*'}" role="${role ?? '*'}"`);
    const user = await this.usersService.findByEmail(email.toLowerCase());
    if (!user) {
      this.logger.warn(`[svc-lookup] no JPS user found for email "${email.toLowerCase()}"`);
      return [];
    }
    const userIdStr = (user._id as unknown as { toString(): string }).toString();
    this.logger.log(`[svc-lookup] found JPS user _id="${userIdStr}" email="${user.email}"`);

    const filter: Record<string, unknown> = {
      user_id: userIdStr,
      deleted_at: null,
    };
    if (platform) filter['platform'] = platform;
    if (role) filter['role'] = role;

    const profiles = await this.profileModel
      .find(filter)
      .sort({ created_at: -1 })
      .limit(50)
      .lean()
      .exec();
    this.logger.log(`[svc-lookup] matched ${profiles.length} profile(s) for user_id="${userIdStr}"`);
    if (profiles.length === 0) {
      // Debug: how many profiles does this user have IGNORING platform/role filter?
      const allForUser = await this.profileModel
        .find({ user_id: userIdStr, deleted_at: null })
        .select('platform role status')
        .lean()
        .exec();
      this.logger.warn(
        `[svc-lookup] user has ${allForUser.length} other profile(s) total: ` +
        JSON.stringify(allForUser),
      );
    }

    // Strip internals before returning to a foreign service.
    return profiles.map((p) => {
      const { user_id: _u, deleted_at: _d, pss_request_id: _r, ...safe } = p;
      void _u; void _d; void _r;
      return safe;
    });
  }

  /**
   * Service-to-service lookup: fetch a single profile by id, but ONLY when
   * the supplied email matches the profile's owning user. Used when GoSellr
   * needs the full owner view of a JPS profile during the attach flow.
   *
   * Returns null if not found, soft-deleted, or owned by a different user
   * (caller should treat as 404 either way).
   */
  async findOwnedByEmail(
    profileId: string,
    email: string,
  ): Promise<Record<string, unknown> | null> {
    const user = await this.usersService.findByEmail(email.toLowerCase());
    if (!user) return null;

    const profile = await this.profileModel
      .findOne({
        _id: profileId,
        user_id: (user._id as unknown as { toString(): string }).toString(),
        deleted_at: null,
      })
      .lean()
      .exec();
    if (!profile) return null;
    const { user_id: _u, deleted_at: _d, pss_request_id: _r, ...safe } = profile;
    void _u; void _d; void _r;
    return safe;
  }

  async findOne(id: string, userId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel
      .findOne({ _id: id, ...this.baseQuery(userId) })
      .exec();
    if (!profile) throw new NotFoundException('Profile not found');

    // Auto-sync from PSS when the profile is in a pending state.
    // This ensures JPS always reflects the authoritative PSS decision even if the
    // webhook was missed (JPS was down, delivery failed, EDR approved after restart).
    if (['submitted', 'under_review'].includes(profile.status)) {
      await this.syncFromPss(profile);
    }

    return profile;
  }

  async create(
    userId: string,
    dto: {
      platform: string;
      role: string;
      display_name: string;
      bio?: string;
      description?: string;
      cnic_front?: string;
      cnic_back?: string;
      address?: string;
      address_proof?: string;
    },
  ): Promise<ProfileDocument> {
    try {
      return await this.profileModel.create({
        user_id: userId,
        platform: dto.platform,
        role: dto.role,
        display_name: dto.display_name,
        bio: dto.bio ?? '',
        description: dto.description ?? '',
        cnic_front: dto.cnic_front ?? null,
        cnic_back: dto.cnic_back ?? null,
        address: dto.address ?? '',
        address_proof: dto.address_proof ?? null,
        status: 'draft',
        sq_level: null,
        pss_request_id: null,
        deleted_at: null,
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) {
        throw new ConflictException(`You already have a ${dto.role} profile on ${dto.platform}`);
      }
      throw err;
    }
  }

  async update(
    id: string,
    userId: string,
    dto: {
      display_name?: string;
      bio?: string;
      description?: string;
      cnic_front?: string;
      cnic_back?: string;
      address?: string;
      address_proof?: string;
    },
  ): Promise<ProfileDocument> {
    const profile = await this.findOne(id, userId);

    if (!['draft', 'resubmit_required'].includes(profile.status)) {
      throw new ForbiddenException('Only draft or resubmit_required profiles can be edited');
    }

    Object.assign(profile, dto);
    return profile.save();
  }

  async submit(id: string, userId: string): Promise<ProfileDocument> {
    const profile = await this.findOne(id, userId);
    this.assertTransition(profile.status, 'submitted');

    // Send to PSS — entity_data must contain every field the criteria set checks.
    // PSS criteria for jps_profile evaluate: display_name, platform, role,
    // bio, description, cnic_front, cnic_back, address, address_proof.
    const pssResult = await this.pssClient.submitForSQ(
      (profile._id as unknown as { toString(): string }).toString(),
      userId,
      'jps_profile',
      {
        platform: profile.platform,
        role: profile.role,
        display_name: profile.display_name,
        bio: profile.bio || null,
        description: profile.description || null,
        cnic_front: profile.cnic_front,
        cnic_back: profile.cnic_back,
        address: profile.address || null,
        address_proof: profile.address_proof,
      },
    );

    if (!pssResult.success) {
      this.logger.error(`PSS submission failed for profile ${id}: ${pssResult.error ?? 'unknown'}`);
      throw new BadRequestException('PSS submission failed — please try again');
    }

    profile.status = 'submitted';
    profile.pss_request_id = pssResult.pss_request_id ?? null;
    return profile.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const profile = await this.findOne(id, userId);
    if (profile.status === 'approved') {
      throw new ForbiddenException('Approved profiles cannot be deleted');
    }
    profile.deleted_at = new Date();
    await profile.save();
  }

  /**
   * Called by WebhooksService when PSS sends sq.under_review.
   * Transitions profile from 'submitted' → 'under_review' so the user
   * sees accurate status while EDR / Franchise review is pending.
   * Safe to call multiple times — idempotent if already under_review.
   */
  async markUnderReview(entityId: string): Promise<void> {
    const profile = await this.profileModel.findById(entityId).exec();
    if (!profile) {
      this.logger.warn(`PSS under_review: profile ${entityId} not found — ignoring`);
      return;
    }
    if (profile.status !== 'submitted') {
      // Already transitioned further — don't overwrite
      return;
    }
    profile.status = 'under_review';
    await profile.save();
    this.logger.log(`Profile ${entityId} → under_review (routed to manual review)`);
  }

  /**
   * Called ONLY by WebhooksService when PSS fires a decision webhook.
   * This is the single write point for sq_level and approval status.
   */
  async updateFromPssWebhook(
    entityId: string,
    decision: 'approved' | 'rejected' | 'conditional',
    sqLevel: number | null,
    rejectionReason?: string,
  ): Promise<void> {
    const profile = await this.profileModel.findById(entityId).exec();
    if (!profile) {
      this.logger.warn(`PSS webhook: profile ${entityId} not found — ignoring`);
      return;
    }

    let newStatus: ProfileStatus;
    if (decision === 'approved') newStatus = 'approved';
    else if (decision === 'conditional') newStatus = 'resubmit_required';
    else newStatus = 'rejected';

    profile.status = newStatus;
    profile.sq_level = sqLevel;
    profile.rejection_reason = rejectionReason ?? null;
    await profile.save();

    this.logger.log(`Profile ${entityId} updated: status=${newStatus} sq_level=${sqLevel}`);
  }

  /**
   * Queries PSS for the authoritative SQ status of a pending profile and applies
   * any decision that PSS has already made — regardless of whether the webhook arrived.
   *
   * Called automatically by findOne() when status is 'submitted' or 'under_review'.
   * Safe to call multiple times (idempotent).
   *
   * PSS status → JPS action:
   *   'approved' → set status=approved + sq_level
   *   'rejected' → set status=rejected + rejection_reason
   *   'pending'  → if still 'submitted' on JPS, advance to 'under_review'
   *   'not_found'→ no-op (profile not yet processed by PSS)
   */
  private async syncFromPss(profile: ProfileDocument): Promise<void> {
    const profileId = (profile._id as unknown as { toString(): string }).toString();
    try {
      const pssStatus = await this.pssClient.getSqStatus(profileId);

      // PSS unreachable / auth error — skip without crashing
      if ('error' in pssStatus) {
        this.logger.warn(`[PssSync] Skipped profile ${profileId}: ${pssStatus.error}`);
        return;
      }

      this.logger.debug(
        `[PssSync] Profile ${profileId} → PSS status=${pssStatus.status} sq_level=${pssStatus.sq_level}`,
      );

      const REVIEW_STATUSES = ['pending', 'pending_edr', 'pending_franchise'];

      if (pssStatus.status === 'approved' || pssStatus.status === 'conditional') {
        profile.status = 'approved';
        profile.sq_level = pssStatus.sq_level ?? null;
        profile.rejection_reason = null;
        await profile.save();
        this.logger.log(
          `[PssSync] Profile ${profileId} → approved SQ${pssStatus.sq_level}`,
        );
      } else if (pssStatus.status === 'rejected') {
        profile.status = 'rejected';
        profile.sq_level = null;
        profile.rejection_reason = pssStatus.rejection_reason ?? 'Rejected by PSS';
        await profile.save();
        this.logger.log(`[PssSync] Profile ${profileId} → rejected`);
      } else if (
        REVIEW_STATUSES.includes(pssStatus.status) &&
        profile.status === 'submitted'
      ) {
        // PSS is routing or has routed to franchise/EDR — advance JPS to under_review
        profile.status = 'under_review';
        await profile.save();
        this.logger.log(
          `[PssSync] Profile ${profileId} → under_review (PSS: ${pssStatus.status})`,
        );
      }
      // 'not_found' → no-op; already under_review and still pending → no-op
    } catch (err) {
      // Never crash findOne() due to a PSS sync failure
      this.logger.warn(`[PssSync] Failed for profile ${profileId}: ${String(err)}`);
    }
  }

  private assertTransition(current: ProfileStatus, next: ProfileStatus): void {
    if (!ALLOWED_TRANSITIONS[current]?.includes(next)) {
      throw new ConflictException(
        `Cannot transition profile from '${current}' to '${next}'`,
      );
    }
  }
}
