import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SqEngineService } from '../sq-engine/sq-engine.service';
import { AuditWriteEvent, SQ_ENGINE_EVENTS } from '../sq-engine/sq-engine.service';
import {
  SqDecisionEvent,
  RULE_ENGINE_EVENTS,
  FranchiseReviewRequestedEvent,
} from '../rule-engine/rule-engine.service';
import { FranchiseService } from '../franchise/franchise.service';
import { AuditService } from '../audit/audit.service';
import { EdrReview, EdrReviewDocument, EdrDecision, EdrSource } from './edr-review.schema';

// ── Input types for service methods ─────────────────────────────────────────

export interface EdrDecideInput {
  decision: Exclude<EdrDecision, 'pending'>;
  sq_level_assigned?: number | null;
  rejection_reason?: string | null;
  reviewed_by: string;
  override_notes?: string | null;
}

export interface EdrOverrideInput {
  new_decision: Exclude<EdrDecision, 'pending'>;
  sq_level_assigned?: number | null;
  rejection_reason?: string | null;
  reviewed_by: string;
  override_notes: string;    // REQUIRED on override
}

export interface EdrEditInput {
  entity_data?: Record<string, unknown> | null;
  notes?: string | null;
  edited_by: string;
}

export interface EdrQueueFilter {
  platform_id?: string;
  decision?: EdrDecision;
  page?: number;
  limit?: number;
}

/**
 * EDR Service — EHB Department of Review
 *
 * EDR is EHB-level: it operates across ALL platforms and is the final
 * authority in the SQ approval chain. No platform restriction on its queries.
 *
 * Entry points:
 *   1. rule-engine emits 'edr.review_requested' (action=edr in platform rules)
 *   2. franchise emits 'edr.review_requested' (decision=escalate)
 *   Both use the same event name — EDR distinguishes by checking assigned_franchise_id.
 *
 * Decision authority:
 *   - Can approve / conditional / reject any request
 *   - Can assign any valid SQ level (1,2,3,5,7,10) — not bound by sq_level_calculated
 *   - Can override a previously decided request by reopening it
 *   - Can edit entity_data on the review record before deciding
 *
 * Event flow:
 *   edr.review_requested →
 *     create EdrReview (decision=pending) →
 *     sqEngineService.forwardToReview('pending_edr') [safe re-set] →
 *     audit.write(edr_assigned)
 *
 *   submitDecision(approved|conditional) →
 *     audit.write FIRST →
 *     sqEngineService.finalizeApproval() →
 *     sq.decision(approved, decided_by:'edr')
 *
 *   submitDecision(rejected) →
 *     audit.write FIRST →
 *     sqEngineService.finalizeRejection() →
 *     sq.decision(rejected, decided_by:'edr')
 *
 *   submitOverride() →
 *     load sq_record → confirm exists →
 *     audit.write(edr_override) FIRST →
 *     sqEngineService.forwardToReview('pending_edr') →
 *     create new EdrReview (source=override) →
 *     apply decision (same path as submitDecision)
 */
@Injectable()
export class EdrService {
  private readonly logger = new Logger(EdrService.name);

  constructor(
    @InjectModel(EdrReview.name)
    private readonly edrReviewModel: Model<EdrReviewDocument>,
    private readonly sqEngineService: SqEngineService,
    private readonly franchiseService: FranchiseService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Event Handler: edr.review_requested ──────────────────────────────────

  /**
   * Listens for 'edr.review_requested' from both:
   *   - rule-engine (RULE_ENGINE_EVENTS.EDR_REVIEW = 'edr.review_requested')
   *   - franchise   (FRANCHISE_EVENTS.EDR_REVIEW    = 'edr.review_requested')
   *
   * Source is determined by whether the SqRequest has assigned_franchise_id set:
   *   has franchise_id → 'franchise_escalation'
   *   no franchise_id  → 'rule_engine'
   */
  @OnEvent('edr.review_requested', { async: true })
  async handleEdrReviewRequested(
    event: FranchiseReviewRequestedEvent,
  ): Promise<void> {
    const {
      sq_request_id,
      entity_id,
      entity_type,
      user_id,
      platform_id,
    } = event;

    this.logger.log(
      `edr.review_requested: sq_request=${sq_request_id} platform=${platform_id} entity=${entity_id}`,
    );

    try {
      // Determine source by checking assigned_franchise_id on the SqRequest
      const sqRequest = await this.sqEngineService.getRequestById(sq_request_id);
      if (!sqRequest) {
        this.logger.error(
          `handleEdrReviewRequested: SqRequest ${sq_request_id} not found — skipping`,
        );
        return;
      }

      const source: EdrSource =
        sqRequest.assigned_franchise_id ? 'franchise_escalation' : 'rule_engine';

      // Upsert EdrReview — idempotent for non-override sources via partial unique index
      // Using findOneAndUpdate with upsert to handle duplicate events gracefully
      await this.edrReviewModel.findOneAndUpdate(
        {
          sq_request_id,
          source: { $in: ['rule_engine', 'franchise_escalation'] },
        },
        {
          $setOnInsert: {
            sq_request_id,
            franchise_review_id: sqRequest.assigned_franchise_id ?? null,
            platform_id,
            entity_id,
            entity_type,
            user_id,
            source,
            decision: 'pending',
            sq_level_assigned: null,
            rejection_reason: null,
            edited_entity_data: null,
            override_notes: null,
            reviewed_by: null,
            reviewed_at: null,
          },
        },
        { upsert: true, new: true },
      );

      // Safely (re-)set status to pending_edr — idempotent if already set
      await this.sqEngineService.forwardToReview(sq_request_id, 'pending_edr');

      // Emit audit.write
      this.emitAuditWrite({
        sq_request_id,
        entity_id,
        entity_type,
        user_id,
        platform_id,
        action: 'edr_assigned',
        reason: `EDR review created. Source: ${source}`,
        performed_by: 'system',
        decided_by: 'edr',
      });

      this.logger.log(
        `EdrReview created: sq_request=${sq_request_id} source=${source} platform=${platform_id}`,
      );
    } catch (err) {
      this.logger.error(
        `handleEdrReviewRequested ERROR: sq_request=${sq_request_id} — ${(err as Error).message}`,
        (err as Error).stack,
      );
      // Do not rethrow — event handlers must not crash the emitter loop
    }
  }

  // ── Decision ──────────────────────────────────────────────────────────────

  /**
   * EDR staff submit a final decision on a pending EDR review.
   *
   * @param sq_request_id - MongoDB ObjectId of the SqRequest (used as primary key here,
   *                        matching the controller's :sq_request_id param pattern)
   * @param input - Decision payload
   *
   * Decisions:
   *   approved / conditional → finalizeApproval → sq.decision(approved)
   *   rejected               → finalizeRejection → sq.decision(rejected)
   */
  async submitDecision(
    sq_request_id: string,
    input: EdrDecideInput,
  ): Promise<EdrReviewDocument> {
    const { decision, sq_level_assigned, rejection_reason, reviewed_by } = input;

    // Load the pending EDR review
    const review = await this.edrReviewModel.findOne({
      sq_request_id,
      decision: 'pending',
    });

    if (!review) {
      throw new NotFoundException(
        `No pending EDR review found for sq_request="${sq_request_id}"`,
      );
    }

    // Validation
    if (decision === 'rejected' && !rejection_reason) {
      throw new BadRequestException(
        'rejection_reason is required when decision=rejected',
      );
    }
    if (
      (decision === 'approved' || decision === 'conditional') &&
      (sq_level_assigned === undefined || sq_level_assigned === null)
    ) {
      throw new BadRequestException(
        `sq_level_assigned is required when decision=${decision}`,
      );
    }

    const reviewedAt = new Date();

    // ── Audit FIRST ───────────────────────────────────────────────────────
    this.emitAuditWrite({
      sq_request_id,
      entity_id: review.entity_id,
      entity_type: review.entity_type,
      user_id: review.user_id,
      platform_id: review.platform_id,
      action: `edr_decision_${decision}`,
      reason:
        decision === 'rejected'
          ? (rejection_reason as string)
          : `EDR ${decision} at SQ level ${sq_level_assigned}`,
      performed_by: reviewed_by,
      sq_level_before: null,
      sq_level_after:
        decision === 'approved' || decision === 'conditional'
          ? (sq_level_assigned as number)
          : null,
      decided_by: 'edr',
    });

    // ── State Mutation ─────────────────────────────────────────────────────
    await this.applyDecision(review, decision, sq_level_assigned ?? null, rejection_reason ?? null, reviewed_by, reviewedAt);

    // ── Update EdrReview record ────────────────────────────────────────────
    const updatedReview = await this.edrReviewModel.findByIdAndUpdate(
      review._id,
      {
        decision,
        sq_level_assigned: sq_level_assigned ?? null,
        rejection_reason: rejection_reason ?? null,
        override_notes: input.override_notes ?? null,
        reviewed_by,
        reviewed_at: reviewedAt,
      },
      { new: true },
    );

    this.logger.log(
      `EDR decision: sq_request=${sq_request_id} decision=${decision} by=${reviewed_by}`,
    );

    return updatedReview as EdrReviewDocument;
  }

  // ── Override ──────────────────────────────────────────────────────────────

  /**
   * EDR re-opens a previously decided SQ request and applies a new decision.
   *
   * Conditions:
   *   - sq_record must exist (i.e. a final decision was previously made)
   *   - override_notes is REQUIRED — no exceptions
   *
   * This creates a NEW EdrReview record with source='override'.
   * The partial unique index on edr_reviews allows multiple override records.
   */
  async submitOverride(
    sq_request_id: string,
    input: EdrOverrideInput,
  ): Promise<EdrReviewDocument> {
    const { new_decision, sq_level_assigned, rejection_reason, reviewed_by, override_notes } = input;

    if (!override_notes || override_notes.trim().length === 0) {
      throw new BadRequestException(
        'override_notes is required when overriding a prior EDR decision',
      );
    }

    // Load SqRequest context
    const sqRequest = await this.sqEngineService.getRequestById(sq_request_id);
    if (!sqRequest) {
      throw new NotFoundException(`SqRequest with id="${sq_request_id}" not found`);
    }

    // Confirm a prior decision exists (sq_record must exist)
    const sqRecord = await this.sqEngineService.getRecordByEntity(
      sqRequest.entity_id,
      sqRequest.platform_id,
    );
    if (!sqRecord) {
      throw new BadRequestException(
        `Cannot override: no finalized SqRecord exists for entity="${sqRequest.entity_id}" ` +
        `on platform="${sqRequest.platform_id}". No prior decision to override.`,
      );
    }

    // Validation
    if (new_decision === 'rejected' && !rejection_reason) {
      throw new BadRequestException(
        'rejection_reason is required when new_decision=rejected',
      );
    }
    if (
      (new_decision === 'approved' || new_decision === 'conditional') &&
      (sq_level_assigned === undefined || sq_level_assigned === null)
    ) {
      throw new BadRequestException(
        `sq_level_assigned is required when new_decision=${new_decision}`,
      );
    }

    const reviewedAt = new Date();

    // ── Audit FIRST ───────────────────────────────────────────────────────
    this.emitAuditWrite({
      sq_request_id,
      entity_id: sqRequest.entity_id,
      entity_type: sqRequest.entity_type,
      user_id: sqRequest.user_id,
      platform_id: sqRequest.platform_id,
      action: 'edr_override',
      reason: override_notes,
      performed_by: reviewed_by,
      sq_level_before: sqRecord.sq_level,
      sq_level_after:
        new_decision === 'approved' || new_decision === 'conditional'
          ? (sq_level_assigned as number)
          : null,
      decided_by: 'edr',
    });

    // Reset sq_request to pending_edr before re-deciding
    await this.sqEngineService.forwardToReview(sq_request_id, 'pending_edr');

    // Create new override EdrReview record
    const overrideReview = await this.edrReviewModel.create({
      sq_request_id,
      franchise_review_id: sqRequest.assigned_franchise_id ?? null,
      platform_id: sqRequest.platform_id,
      entity_id: sqRequest.entity_id,
      entity_type: sqRequest.entity_type,
      user_id: sqRequest.user_id,
      source: 'override' as EdrSource,
      decision: 'pending',
      sq_level_assigned: null,
      rejection_reason: null,
      edited_entity_data: null,
      override_notes,
      reviewed_by: null,
      reviewed_at: null,
    });

    // Apply the new decision
    await this.applyDecision(
      overrideReview,
      new_decision,
      sq_level_assigned ?? null,
      rejection_reason ?? null,
      reviewed_by,
      reviewedAt,
    );

    // Finalize the override review record
    const finalReview = await this.edrReviewModel.findByIdAndUpdate(
      overrideReview._id,
      {
        decision: new_decision,
        sq_level_assigned: sq_level_assigned ?? null,
        rejection_reason: rejection_reason ?? null,
        override_notes,
        reviewed_by,
        reviewed_at: reviewedAt,
      },
      { new: true },
    );

    this.logger.log(
      `EDR override: sq_request=${sq_request_id} new_decision=${new_decision} by=${reviewed_by}`,
    );

    return finalReview as EdrReviewDocument;
  }

  // ── Edit Entity Data ──────────────────────────────────────────────────────

  /**
   * EDR edits entity_data on the review record before making a decision.
   * The edited data is stored in edr_review.edited_entity_data — the original
   * SqRequest.entity_data is NOT modified (kept for audit trail integrity).
   *
   * When EDR decides after editing, it can reference the edited data in its
   * decision rationale. The sq-engine finalization uses the assigned SQ level
   * directly — re-scoring is an EDR staff responsibility, not automated.
   */
  async editReviewEntityData(
    sq_request_id: string,
    input: EdrEditInput,
  ): Promise<EdrReviewDocument> {
    const review = await this.edrReviewModel.findOne({
      sq_request_id,
      decision: 'pending',
    });

    if (!review) {
      throw new NotFoundException(
        `No pending EDR review found for sq_request="${sq_request_id}"`,
      );
    }

    // Load sq_request context for audit
    const sqRequest = await this.sqEngineService.getRequestById(sq_request_id);

    // Emit audit.write for the edit action
    if (sqRequest) {
      this.emitAuditWrite({
        sq_request_id,
        entity_id: sqRequest.entity_id,
        entity_type: sqRequest.entity_type,
        user_id: sqRequest.user_id,
        platform_id: sqRequest.platform_id,
        action: 'edr_edited_request',
        reason: input.notes ?? 'EDR edited entity data before deciding',
        performed_by: input.edited_by,
        decided_by: 'edr',
      });
    }

    const updatedReview = await this.edrReviewModel.findByIdAndUpdate(
      review._id,
      {
        edited_entity_data: input.entity_data ?? null,
        override_notes: input.notes ?? review.override_notes,
      },
      { new: true },
    );

    this.logger.log(
      `EDR edit: sq_request=${sq_request_id} by=${input.edited_by}`,
    );

    return updatedReview as EdrReviewDocument;
  }

  // ── Query Methods ─────────────────────────────────────────────────────────

  /**
   * Returns paginated EDR reviews across all platforms.
   * Optionally filtered by platform_id and/or decision status.
   * Sorted oldest-first (FIFO queue) by default.
   */
  async getQueue(filter: EdrQueueFilter): Promise<{
    data: EdrReviewDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      platform_id,
      decision = 'pending',
      page = 1,
      limit = 20,
    } = filter;

    const query: Record<string, unknown> = {};
    if (platform_id) query['platform_id'] = platform_id;
    if (decision) query['decision'] = decision;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.edrReviewModel
        .find(query)
        .sort({ created_at: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.edrReviewModel.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Returns the full detail view for EDR staff:
   *   - sq_request
   *   - sq_record (if exists — may be null for fresh requests)
   *   - franchise_review (if source=franchise_escalation)
   *   - edr_reviews (history — all reviews for this sq_request)
   *   - audit_trail (full chronological log from AuditService)
   */
  async getFullDetail(sq_request_id: string): Promise<{
    sq_request: Record<string, unknown> | null;
    sq_record: Record<string, unknown> | null;
    franchise_review: Record<string, unknown> | null;
    edr_reviews: EdrReviewDocument[];
    audit_trail: Record<string, unknown>[];
  }> {
    const sqRequest = await this.sqEngineService.getRequestById(sq_request_id);

    if (!sqRequest) {
      throw new NotFoundException(
        `SqRequest with id="${sq_request_id}" not found`,
      );
    }

    const [sqRecord, franchiseReview, edrReviews, auditLogs] = await Promise.all([
      this.sqEngineService.getRecordByEntity(
        sqRequest.entity_id,
        sqRequest.platform_id,
      ),
      this.franchiseService.getReviewBySqRequestId(sq_request_id),
      this.edrReviewModel
        .find({ sq_request_id })
        .sort({ created_at: -1 })
        .exec(),
      this.auditService.getLogsForRequest(sq_request_id),
    ]);

    return {
      sq_request: sqRequest.toObject() as unknown as Record<string, unknown>,
      sq_record: sqRecord ? (sqRecord.toObject() as unknown as Record<string, unknown>) : null,
      franchise_review: franchiseReview
        ? (franchiseReview.toObject() as unknown as Record<string, unknown>)
        : null,
      edr_reviews: edrReviews,
      audit_trail: auditLogs.map((log) => log.toObject() as unknown as Record<string, unknown>),
    };
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Core decision application logic shared by submitDecision and submitOverride.
   * Calls sqEngineService to finalize the SqRequest + SqRecord,
   * then emits sq.decision to trigger the webhook module.
   */
  private async applyDecision(
    review: EdrReviewDocument,
    decision: Exclude<EdrDecision, 'pending'>,
    sq_level_assigned: number | null,
    rejection_reason: string | null,
    reviewed_by: string,
    decidedAt: Date,
  ): Promise<void> {
    if (decision === 'approved' || decision === 'conditional') {
      await this.sqEngineService.finalizeApproval(
        review.sq_request_id,
        sq_level_assigned as number,
        'edr',
      );

      const decisionEvent: SqDecisionEvent = {
        sq_request_id: review.sq_request_id,
        entity_id: review.entity_id,
        entity_type: review.entity_type,
        user_id: review.user_id,
        platform_id: review.platform_id,
        decision: 'approved',
        sq_level: sq_level_assigned,
        decided_by: 'edr',
        decided_at: decidedAt,
        rejection_reason: null,
      };
      this.eventEmitter.emit(RULE_ENGINE_EVENTS.DECISION, decisionEvent);

    } else {
      // rejected
      await this.sqEngineService.finalizeRejection(
        review.sq_request_id,
        rejection_reason as string,
        'edr',
      );

      const decisionEvent: SqDecisionEvent = {
        sq_request_id: review.sq_request_id,
        entity_id: review.entity_id,
        entity_type: review.entity_type,
        user_id: review.user_id,
        platform_id: review.platform_id,
        decision: 'rejected',
        sq_level: null,
        decided_by: 'edr',
        decided_at: decidedAt,
        rejection_reason: rejection_reason as string,
      };
      this.eventEmitter.emit(RULE_ENGINE_EVENTS.DECISION, decisionEvent);
    }
  }

  /** Emits an audit.write event — audit module subscribes and persists it */
  private emitAuditWrite(payload: AuditWriteEvent): void {
    this.eventEmitter.emit(SQ_ENGINE_EVENTS.AUDIT_WRITE, payload);
  }
}
