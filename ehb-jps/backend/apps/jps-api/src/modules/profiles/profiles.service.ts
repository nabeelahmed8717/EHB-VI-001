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
import { ProfileStatus } from '../../../../../../libs/jps-types/src';
import { PssClientService } from '../pss-client/pss-client.service';

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

  async findOne(id: string, userId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel
      .findOne({ _id: id, ...this.baseQuery(userId) })
      .exec();
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async create(
    userId: string,
    dto: {
      role: string;
      display_name: string;
      bio?: string;
      role_data?: Record<string, unknown>;
    },
  ): Promise<ProfileDocument> {
    try {
      return await this.profileModel.create({
        user_id: userId,
        role: dto.role,
        display_name: dto.display_name,
        bio: dto.bio ?? '',
        role_data: dto.role_data ?? {},
        status: 'draft',
        sq_level: null,
        pss_request_id: null,
        deleted_at: null,
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) {
        throw new ConflictException(`You already have a ${dto.role} profile`);
      }
      throw err;
    }
  }

  async update(
    id: string,
    userId: string,
    dto: { display_name?: string; bio?: string; role_data?: Record<string, unknown> },
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

    // Send to PSS
    const pssResult = await this.pssClient.submitForSQ(
      (profile._id as unknown as { toString(): string }).toString(),
      userId,
      'jps_profile',
      {
        role: profile.role,
        display_name: profile.display_name,
        role_data: profile.role_data,
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

  private assertTransition(current: ProfileStatus, next: ProfileStatus): void {
    if (!ALLOWED_TRANSITIONS[current]?.includes(next)) {
      throw new ConflictException(
        `Cannot transition profile from '${current}' to '${next}'`,
      );
    }
  }
}
