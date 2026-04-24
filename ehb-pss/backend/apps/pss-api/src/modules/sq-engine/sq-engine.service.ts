import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SqLevel, SQ_LEVEL_LABELS } from '@ehb-pss/types';
import {
  SqSubmitRequestDto,
  SqSubmitResponseDto,
  SqAlreadyActiveResponseDto,
  SqStatusResponseDto,
  SqBulkStatusRequestDto,
  SqBulkStatusResponseDto,
  SqBulkStatusItemDto,
} from '@ehb-pss/dtos';
import { calculateSqLevel, getSqBadgeLabel } from '@ehb-pss/utils';
import { SqRequest, SqRequestDocument } from './sq-request.schema';
import { SqRecord, SqRecordDocument } from './sq-record.schema';
import { CriteriaService } from '../criteria/criteria.service';

// ── Internal Event Contracts ────────────────────────────────────────────────
// These are the events sq-engine emits. Other modules subscribe to them.

export const SQ_ENGINE_EVENTS = {
  /** Emitted after scoring — rule-engine subscribes to this */
  SCORED: 'sq.scored',
  /** Emitted for every status change — audit module subscribes to this */
  AUDIT_WRITE: 'audit.write',
} as const;

/**
 * Payload emitted on 'sq.scored'.
 * rule-engine uses this to decide: auto_approve / forward_franchise / forward_edr.
 */
export interface SqScoredEvent {
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  sq_level_calculated: SqLevel | null;
  criteria_met: number;
  total_criteria: number;
  sq_score: number;
}

/**
 * Payload emitted on 'audit.write'.
 * audit module writes this to pss_db.audit_logs.
 *
 * Top-level fields map 1:1 to audit_log schema fields.
 * sq_level_before, sq_level_after, decided_by are folded into
 * the schema's `metadata` Mixed field by AuditService.writeLog().
 * Callers may also pass arbitrary extra context via `metadata`.
 */
export interface AuditWriteEvent {
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  action: string;
  reason: string;
  performed_by: string;   // userId or 'system'
  // Optional structured context — folded into metadata on persist
  sq_level_before?: SqLevel | null;
  sq_level_after?: SqLevel | null;
  decided_by?: string;
  metadata?: Record<string, unknown>;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SqEngineService {
  private readonly logger = new Logger(SqEngineService.name);

  constructor(
    @InjectModel(SqRequest.name)
    private readonly sqRequestModel: Model<SqRequestDocument>,

    @InjectModel(SqRecord.name)
    private readonly sqRecordModel: Model<SqRecordDocument>,

    private readonly criteriaService: CriteriaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Submit for SQ Approval ─────────────────────────────────────────────

  /**
   * POST /sq/submit
   *
   * Receives an entity from a platform, loads its criteria set,
   * scores it, persists the SqRequest, and emits 'sq.scored' for
   * rule-engine to decide routing.
   *
   * Returns immediately with { pending } — decision arrives via webhook.
   */
  async submitForSQ(
    dto: SqSubmitRequestDto,
  ): Promise<SqSubmitResponseDto | SqAlreadyActiveResponseDto> {
    const { entity_id, entity_type, user_id, platform_id, entity_data } = dto;

    // ── 1. Guard: check for existing active SQ ──────────────────────────
    const existingRecord = await this.sqRecordModel.findOne({
      entity_id,
      platform_id,
      status: { $in: ['approved', 'conditional'] },
    });

    if (existingRecord) {
      this.logger.warn(
        `SQ submit rejected — entity ${entity_id} already has active SQ on ${platform_id}`,
      );
      const alreadyActive: SqAlreadyActiveResponseDto = {
        success: false,
        code: 'ALREADY_HAS_SQ',
        current_sq_level: existingRecord.sq_level ?? undefined,
        message: 'Entity already has an active SQ level',
      };
      return alreadyActive;
    }

    // ── 2. Guard: check for in-flight pending request ───────────────────
    const pendingRequest = await this.sqRequestModel.findOne({
      entity_id,
      platform_id,
      status: { $in: ['pending', 'pending_franchise', 'pending_edr'] },
    });

    if (pendingRequest) {
      this.logger.warn(
        `SQ submit rejected — entity ${entity_id} already has a pending SQ request on ${platform_id}`,
      );
      const alreadyActive: SqAlreadyActiveResponseDto = {
        success: false,
        code: 'ALREADY_HAS_SQ',
        message: 'Entity already has a pending SQ request in progress',
      };
      return alreadyActive;
    }

    // ── 3. Load criteria set for this platform + entity_type ────────────
    const criteriaSet = await this.criteriaService.getCriteriaSet(
      platform_id,
      entity_type,
    );

    if (!criteriaSet || criteriaSet.criteria.length === 0) {
      this.logger.warn(
        `No active criteria set found for platform=${platform_id} entity_type=${entity_type}. ` +
        `Scoring with 0 criteria — entity will receive null SQ level.`,
      );
    }

    // ── 4. Evaluate criteria against entity_data (full check_type support) ─
    const { criteria_met, total_criteria, sq_score } =
      this.criteriaService.evaluateCriteria(criteriaSet, entity_data);

    // ── 5. Calculate SQ level from score ────────────────────────────────
    const sq_level_calculated = calculateSqLevel(sq_score);

    this.logger.log(
      `Scoring entity=${entity_id} platform=${platform_id}: ` +
      `${criteria_met}/${total_criteria} criteria met → ${sq_score}% → SQ${sq_level_calculated ?? 'null'}`,
    );

    // ── 6. Persist SqRequest with status "pending" ───────────────────────
    const sqRequest = new this.sqRequestModel({
      entity_id,
      entity_type,
      user_id,
      platform_id,
      entity_data,
      criteria_met,
      total_criteria,
      sq_score,
      sq_level_calculated,
      status: 'pending',
      decided_by: null,
      rejection_reason: null,
      decided_at: null,
    });

    const saved = await sqRequest.save();
    const sq_request_id = (saved._id as object).toString();

    // ── 7. Write audit log: sq_submitted ────────────────────────────────
    this.emitAuditWrite({
      sq_request_id,
      entity_id,
      entity_type,
      user_id,
      platform_id,
      action: 'sq_submitted',
      reason: `Entity submitted for SQ approval. Score: ${sq_score}% (${criteria_met}/${total_criteria} criteria). ` +
               `Calculated level: SQ${sq_level_calculated ?? 'none'}.`,
      performed_by: 'system',
      sq_level_before: null,
      sq_level_after: null,
    });

    // ── 8. Emit 'sq.scored' for rule-engine ─────────────────────────────
    const scoredPayload: SqScoredEvent = {
      sq_request_id,
      entity_id,
      entity_type,
      user_id,
      platform_id,
      sq_level_calculated,
      criteria_met,
      total_criteria,
      sq_score,
    };

    this.eventEmitter.emit(SQ_ENGINE_EVENTS.SCORED, scoredPayload);
    this.logger.log(
      `Emitted '${SQ_ENGINE_EVENTS.SCORED}' for sq_request_id=${sq_request_id}`,
    );

    // ── 9. Return pending response to platform ───────────────────────────
    return {
      success: true,
      sq_request_id,
      status: 'pending',
      message: 'SQ request submitted successfully',
    };
  }

  // ── Get SQ Status (single entity) ─────────────────────────────────────

  /**
   * GET /sq/status/:entity_id?platform_id=gosellr
   *
   * Returns the current SQ status for an entity.
   * Priority: sq_records (final states) → sq_requests (in-flight states).
   */
  async getSqStatus(
    entity_id: string,
    platform_id: string,
  ): Promise<SqStatusResponseDto> {
    // Check sq_records first — these hold approved / conditional / rejected final states
    const record = await this.sqRecordModel.findOne({ entity_id, platform_id });

    if (record) {
      return this.buildStatusResponseFromRecord(record);
    }

    // Fall back to sq_requests — still in-flight (pending / pending_franchise / pending_edr)
    const request = await this.sqRequestModel
      .findOne({ entity_id, platform_id })
      .sort({ created_at: -1 });

    if (request) {
      return this.buildStatusResponseFromRequest(request);
    }

    throw new NotFoundException(
      `No SQ record found for entity_id=${entity_id} on platform=${platform_id}`,
    );
  }

  // ── Get SQ Status (bulk) ───────────────────────────────────────────────

  /**
   * POST /sq/status/bulk
   *
   * Returns SQ status for multiple entities in one call.
   * Used by platform frontends to render SQ badges on listing pages.
   * Entities with no record return status='pending' with sq_level=null.
   */
  async getBulkSqStatus(
    dto: SqBulkStatusRequestDto,
  ): Promise<SqBulkStatusResponseDto> {
    const { platform_id, entity_ids } = dto;

    // Fetch all matching records in a single query
    const records = await this.sqRecordModel.find({
      platform_id,
      entity_id: { $in: entity_ids },
    });

    // Index by entity_id for O(1) lookup
    const recordMap = new Map(records.map((r) => [r.entity_id, r]));

    const results: SqBulkStatusItemDto[] = entity_ids.map((entity_id) => {
      const record = recordMap.get(entity_id);
      return {
        entity_id,
        sq_level: record ? (record.sq_level as SqLevel | null) : null,
        status: (record?.status ?? 'pending') as SqStatusResponseDto['status'],
      };
    });

    return { results };
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  // evaluateCriteria and isCriterionSatisfied have been moved to CriteriaService.
  // SqEngineService now delegates scoring to:
  //   criteriaService.getCriteriaSet(platform_id, entity_type)
  //   criteriaService.evaluateCriteria(criteriaSet, entity_data)
  // This enables full check_type support (presence | min_length | min_value | regex).

  /** Builds a SqStatusResponseDto from a final sq_record */
  private buildStatusResponseFromRecord(
    record: SqRecordDocument,
  ): SqStatusResponseDto {
    const response: SqStatusResponseDto = {
      entity_id: record.entity_id,
      platform_id: record.platform_id,
      sq_level: record.sq_level as SqLevel | null,
      status: record.status as SqStatusResponseDto['status'],
    };

    if (record.status === 'approved' || record.status === 'conditional') {
      response.approved_at = record.approved_at ?? undefined;
      response.expires_at = record.expires_at;
      if (record.sq_level) {
        response.badge_label = getSqBadgeLabel(record.sq_level as SqLevel);
      }
    }

    if (record.status === 'rejected') {
      response.rejection_reason = record.rejection_reason ?? undefined;
      response.rejected_at = record.rejected_at ?? undefined;
      response.can_resubmit = record.can_resubmit;
    }

    return response;
  }

  /** Builds a SqStatusResponseDto from an in-flight sq_request */
  private buildStatusResponseFromRequest(
    request: SqRequestDocument,
  ): SqStatusResponseDto {
    const response: SqStatusResponseDto = {
      entity_id: request.entity_id,
      platform_id: request.platform_id,
      sq_level: null,
      status: request.status as SqStatusResponseDto['status'],
    };

    if (request.status === 'pending_franchise') {
      response.pending_at = 'franchise';
      response.message = 'Under franchise review';
    } else if (request.status === 'pending_edr') {
      response.pending_at = 'edr';
      response.message = 'Under EDR review';
    } else {
      response.message = 'SQ evaluation in progress';
    }

    return response;
  }

  // ── Decision Methods (called by rule-engine, franchise, EDR) ──────────────
  // These are the only write-back paths into sq_requests and sq_records.
  // All callers go through these methods — they never write to the schemas directly.

  /**
   * Retrieves a SqRequest by its MongoDB _id.
   * Used by rule-engine/franchise/EDR to load context before emitting events.
   */
  async getRequestById(
    sq_request_id: string,
  ): Promise<SqRequestDocument | null> {
    return this.sqRequestModel.findById(sq_request_id).exec();
  }

  /**
   * Retrieves the SqRecord (trust ledger entry) for a given entity + platform.
   * EDR uses this to confirm a record exists before attempting an override.
   * Also useful for the full-detail view endpoint.
   */
  async getRecordByEntity(
    entity_id: string,
    platform_id: string,
  ): Promise<SqRecordDocument | null> {
    return this.sqRecordModel
      .findOne({ entity_id, platform_id })
      .exec();
  }

  // ── Admin Queries (PSS Dashboard) ─────────────────────────────────────────

  /**
   * Lists SQ requests with optional filters and pagination.
   * Used by the PSS admin dashboard to view all submitted requests.
   */
  async listRequests(filters: {
    status?: string;
    platform_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const { status, platform_id, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (status) query['status'] = status;
    if (platform_id) query['platform_id'] = platform_id;

    const [data, total] = await Promise.all([
      this.sqRequestModel
        .find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.sqRequestModel.countDocuments(query),
    ]);

    return {
      data: (data as Record<string, unknown>[]).map(this.normaliseRequest),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns full details for a single SQ request by its MongoDB _id.
   * Used by PSS admin dashboard detail view.
   */
  async getRequestDetail(sq_request_id: string): Promise<Record<string, unknown>> {
    const req = await this.sqRequestModel.findById(sq_request_id).lean().exec();
    if (!req) {
      throw new NotFoundException(`SQ request "${sq_request_id}" not found`);
    }
    return this.normaliseRequest(req as Record<string, unknown>);
  }

  /**
   * Adds frontend-expected aliases to a lean SqRequest document:
   *   sq_request_id  → _id.toString()   (frontend type uses this as the row key)
   *   submitted_at   → created_at        (frontend type uses this for display)
   */
  private normaliseRequest(doc: Record<string, unknown>): Record<string, unknown> {
    const id = doc['_id'];
    return {
      ...doc,
      sq_request_id: id ? String(id) : undefined,
      submitted_at: doc['created_at'],
    };
  }

  /**
   * Approves an SQ request and upserts the trust ledger (sq_records).
   * Called by rule-engine (auto) or franchise/EDR (manual).
   *
   * @param sq_level - The SQ level to assign (rule's sq_level_assigned
   *                   or fallback to sq_level_calculated from event)
   * @param decided_by - 'auto' | 'franchise' | 'edr'
   */
  async finalizeApproval(
    sq_request_id: string,
    sq_level: number,
    decided_by: string,
  ): Promise<SqRequestDocument | null> {
    const decidedAt = new Date();

    const request = await this.sqRequestModel.findByIdAndUpdate(
      sq_request_id,
      { status: 'approved', decided_by, decided_at: decidedAt },
      { new: true },
    );

    if (!request) {
      this.logger.error(
        `finalizeApproval: SqRequest ${sq_request_id} not found`,
      );
      return null;
    }

    // Upsert trust ledger — create or overwrite existing record
    await this.sqRecordModel.findOneAndUpdate(
      { entity_id: request.entity_id, platform_id: request.platform_id },
      {
        entity_id: request.entity_id,
        entity_type: request.entity_type,
        user_id: request.user_id,
        platform_id: request.platform_id,
        sq_level,
        status: 'approved',
        badge_label: getSqBadgeLabel(sq_level as SqLevel),
        approved_at: decidedAt,
        expires_at: null,
        rejection_reason: null,
        rejected_at: null,
        can_resubmit: false,
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      `Approved: entity=${request.entity_id} platform=${request.platform_id} ` +
      `SQ${sq_level} decided_by=${decided_by}`,
    );
    return request;
  }

  /**
   * Rejects an SQ request and upserts the trust ledger with rejected status.
   * rejection_reason is required — no silent rejections.
   *
   * @param decided_by - 'auto' | 'franchise' | 'edr'
   */
  async finalizeRejection(
    sq_request_id: string,
    rejection_reason: string,
    decided_by: string,
  ): Promise<SqRequestDocument | null> {
    const decidedAt = new Date();

    const request = await this.sqRequestModel.findByIdAndUpdate(
      sq_request_id,
      { status: 'rejected', decided_by, decided_at: decidedAt, rejection_reason },
      { new: true },
    );

    if (!request) {
      this.logger.error(
        `finalizeRejection: SqRequest ${sq_request_id} not found`,
      );
      return null;
    }

    await this.sqRecordModel.findOneAndUpdate(
      { entity_id: request.entity_id, platform_id: request.platform_id },
      {
        entity_id: request.entity_id,
        entity_type: request.entity_type,
        user_id: request.user_id,
        platform_id: request.platform_id,
        sq_level: null,
        status: 'rejected',
        badge_label: null,
        approved_at: null,
        expires_at: null,
        rejection_reason,
        rejected_at: decidedAt,
        can_resubmit: true,
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      `Rejected: entity=${request.entity_id} platform=${request.platform_id} ` +
      `reason="${rejection_reason}" decided_by=${decided_by}`,
    );
    return request;
  }

  /**
   * Forwards an SQ request to franchise or EDR for manual review.
   * Only updates SqRequest.status — SqRecord is NOT updated here
   * (remains pending until franchise/EDR makes a final decision).
   */
  async forwardToReview(
    sq_request_id: string,
    newStatus: 'pending_franchise' | 'pending_edr',
  ): Promise<SqRequestDocument | null> {
    const request = await this.sqRequestModel.findByIdAndUpdate(
      sq_request_id,
      { status: newStatus },
      { new: true },
    );

    if (!request) {
      this.logger.error(
        `forwardToReview: SqRequest ${sq_request_id} not found`,
      );
      return null;
    }

    this.logger.log(
      `Forwarded: sq_request=${sq_request_id} → ${newStatus}`,
    );
    return request;
  }

  /**
   * Sets assigned_franchise_id on an SqRequest.
   * Called by FranchiseService after auto-creating/finding the franchise
   * responsible for the entity's area. This links the request to the franchise
   * record so staff can look up their assigned queue.
   *
   * NOTE: This is a write helper — it does NOT change status or emit events.
   * FranchiseService controls that flow independently.
   */
  async assignFranchise(
    sq_request_id: string,
    franchise_id: string,
  ): Promise<SqRequestDocument | null> {
    const request = await this.sqRequestModel.findByIdAndUpdate(
      sq_request_id,
      { assigned_franchise_id: franchise_id },
      { new: true },
    );

    if (!request) {
      this.logger.error(
        `assignFranchise: SqRequest ${sq_request_id} not found`,
      );
      return null;
    }

    this.logger.log(
      `Assigned franchise: sq_request=${sq_request_id} → franchise=${franchise_id}`,
    );
    return request;
  }

  /** Emits an audit.write event — audit module subscribes and persists it */
  private emitAuditWrite(payload: AuditWriteEvent): void {
    this.eventEmitter.emit(SQ_ENGINE_EVENTS.AUDIT_WRITE, payload);
  }
}
