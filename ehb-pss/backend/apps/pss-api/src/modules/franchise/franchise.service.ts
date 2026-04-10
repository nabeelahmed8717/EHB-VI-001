import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SqEngineService } from '../sq-engine/sq-engine.service';
import { AuditWriteEvent, SQ_ENGINE_EVENTS } from '../sq-engine/sq-engine.service';
import {
  FranchiseReviewRequestedEvent,
  SqDecisionEvent,
  RULE_ENGINE_EVENTS,
} from '../rule-engine/rule-engine.service';
import { Franchise, FranchiseDocument } from './franchise.schema';
import { FranchiseReview, FranchiseReviewDocument, FranchiseDecision } from './franchise-review.schema';

// ── Internal Event Contracts ─────────────────────────────────────────────────

export const FRANCHISE_EVENTS = {
  /** Emitted after franchise routes an entity to EDR (escalation) */
  EDR_REVIEW: 'edr.review_requested',
} as const;

// ── DTOs for controller/service boundary ────────────────────────────────────

export interface SubmitFranchiseDecisionInput {
  /** 'approve' | 'reject' | 'escalate' */
  decision: FranchiseDecision;
  /** Required when decision=approve. Defaults to sq_level_calculated if omitted. */
  sq_level_assigned?: number | null;
  /** Required when decision=reject */
  rejection_reason?: string | null;
  /** Optional internal notes — not forwarded to platform webhook */
  reviewer_notes?: string | null;
  /** ID of the franchise staff member submitting this decision */
  reviewed_by: string;
}

/**
 * Franchise Service
 *
 * Responsibilities:
 *   1. Auto-create (upsert) Franchise records when franchise.review_requested arrives.
 *   2. Create FranchiseReview records linking the SqRequest to the franchise.
 *   3. Accept franchise staff decisions (approve / reject / escalate).
 *   4. Call SqEngineService to finalize the SqRequest and SqRecord.
 *   5. Emit sq.decision (approved/rejected) or edr.review_requested (escalate).
 *   6. Always emit audit.write BEFORE any state mutation.
 *
 * Event flow:
 *   franchise.review_requested  ← rule-engine
 *     → upsert Franchise (platform_id, area)
 *     → upsert FranchiseReview (sq_request_id)
 *     → sqEngineService.assignFranchise()
 *     → sqEngineService.forwardToReview('pending_franchise')
 *     → audit.write(franchise_assigned)
 *
 *   submitDecision(approve) →
 *     audit.write(franchise_decision_approve) →
 *     sqEngineService.finalizeApproval() →
 *     sq.decision(approved)
 *
 *   submitDecision(reject) →
 *     audit.write(franchise_decision_reject) →
 *     sqEngineService.finalizeRejection() →
 *     sq.decision(rejected)
 *
 *   submitDecision(escalate) →
 *     audit.write(franchise_escalate_edr) →
 *     sqEngineService.forwardToReview('pending_edr') →
 *     edr.review_requested
 */
@Injectable()
export class FranchiseService {
  private readonly logger = new Logger(FranchiseService.name);

  constructor(
    @InjectModel(Franchise.name)
    private readonly franchiseModel: Model<FranchiseDocument>,
    @InjectModel(FranchiseReview.name)
    private readonly franchiseReviewModel: Model<FranchiseReviewDocument>,
    private readonly sqEngineService: SqEngineService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Event Handler: franchise.review_requested ────────────────────────────

  /**
   * Triggered by rule-engine when it routes an entity to franchise review.
   *
   * Steps:
   *   1. Derive area from sq_request entity_data (load via sqEngineService.getRequestById).
   *   2. Upsert Franchise by (platform_id, area) — idempotent.
   *   3. Upsert FranchiseReview by sq_request_id — idempotent.
   *   4. Link sq_request → franchise via sqEngineService.assignFranchise().
   *   5. Update sq_request status to 'pending_franchise'.
   *   6. Emit audit.write.
   */
  @OnEvent(RULE_ENGINE_EVENTS.FRANCHISE_REVIEW, { async: true })
  async handleFranchiseReviewRequested(
    event: FranchiseReviewRequestedEvent,
  ): Promise<void> {
    const {
      sq_request_id,
      entity_id,
      entity_type,
      user_id,
      platform_id,
      sq_level_calculated,
      criteria_met,
      total_criteria,
    } = event;

    this.logger.log(
      `franchise.review_requested: sq_request=${sq_request_id} platform=${platform_id} entity=${entity_id}`,
    );

    try {
      // Step 1 — Load request to extract entity_data.area / city
      const sqRequest = await this.sqEngineService.getRequestById(sq_request_id);
      if (!sqRequest) {
        this.logger.error(
          `handleFranchiseReviewRequested: SqRequest ${sq_request_id} not found — skipping`,
        );
        return;
      }

      const entityData = sqRequest.entity_data ?? {};
      const area = this.extractArea(entityData);

      // Step 2 — Upsert Franchise (idempotent by platform_id + area)
      const franchise = await this.franchiseModel.findOneAndUpdate(
        { platform_id, area },
        {
          $setOnInsert: {
            platform_id,
            area,
            franchise_name: null,
            contact_email: null,
            contact_phone: null,
            active: true,
          },
          $inc: {
            pending_review_count: 1,
            total_reviews_assigned: 1,
          },
        },
        { upsert: true, new: true },
      );

      const franchise_id = (franchise._id as any).toString();

      this.logger.log(
        `Franchise upserted: franchise_id=${franchise_id} area=${area} platform=${platform_id}`,
      );

      // Step 3 — Upsert FranchiseReview (idempotent by sq_request_id)
      await this.franchiseReviewModel.findOneAndUpdate(
        { sq_request_id },
        {
          $setOnInsert: {
            sq_request_id,
            franchise_id,
            entity_id,
            entity_type,
            platform_id,
            user_id,
            sq_level_calculated: sq_level_calculated ?? null,
            criteria_met,
            total_criteria,
            status: 'pending',
            decision: null,
            sq_level_assigned: null,
            rejection_reason: null,
            reviewer_notes: null,
            reviewed_by: null,
            decided_at: null,
          },
        },
        { upsert: true, new: true },
      );

      // Step 4 — Link sq_request → franchise_id
      await this.sqEngineService.assignFranchise(sq_request_id, franchise_id);

      // Step 5 — Set sq_request status → pending_franchise
      await this.sqEngineService.forwardToReview(sq_request_id, 'pending_franchise');

      // Step 6 — Emit audit.write
      this.emitAuditWrite({
        sq_request_id,
        entity_id,
        entity_type,
        user_id,
        platform_id,
        action: 'franchise_assigned',
        reason: `Entity assigned to franchise ${franchise_id} for area "${area}"`,
        performed_by: 'system',
        sq_level_before: null,
        sq_level_after: null,
        decided_by: 'franchise',
      });

      this.logger.log(
        `FranchiseReview created: sq_request=${sq_request_id} franchise=${franchise_id}`,
      );
    } catch (err) {
      this.logger.error(
        `handleFranchiseReviewRequested ERROR: sq_request=${sq_request_id} — ${(err as Error).message}`,
        (err as Error).stack,
      );
      // Do not rethrow — event handlers must not crash the emitter loop
    }
  }

  // ── Decision Methods ─────────────────────────────────────────────────────

  /**
   * Franchise staff submit their decision on a pending review.
   *
   * @param franchise_review_id - MongoDB ObjectId of the FranchiseReview
   * @param input - Decision payload from franchise staff controller
   *
   * Decisions:
   *   approve   → finalizeApproval → sq.decision(approved)
   *   reject    → finalizeRejection → sq.decision(rejected)
   *   escalate  → forwardToReview('pending_edr') → edr.review_requested
   */
  async submitDecision(
    franchise_review_id: string,
    input: SubmitFranchiseDecisionInput,
  ): Promise<FranchiseReviewDocument> {
    const review = await this.franchiseReviewModel.findById(franchise_review_id);

    if (!review) {
      throw new NotFoundException(
        `FranchiseReview with id="${franchise_review_id}" not found`,
      );
    }

    if (review.status !== 'pending') {
      throw new BadRequestException(
        `FranchiseReview "${franchise_review_id}" is already in status "${review.status}" — cannot re-decide`,
      );
    }

    const { decision, sq_level_assigned, rejection_reason, reviewer_notes, reviewed_by } = input;

    // Validation
    if (decision === 'reject' && !rejection_reason) {
      throw new BadRequestException(
        'rejection_reason is required when decision=reject',
      );
    }

    const decidedAt = new Date();

    // Resolve SQ level for approve
    const resolvedSqLevel: number | null =
      decision === 'approve'
        ? (sq_level_assigned ?? review.sq_level_calculated ?? null)
        : null;

    if (decision === 'approve' && resolvedSqLevel === null) {
      throw new BadRequestException(
        `decision=approve requires sq_level_assigned or sq_level_calculated on the review. Neither is available for review="${franchise_review_id}"`,
      );
    }

    // ── Audit FIRST ────────────────────────────────────────────────────────
    this.emitAuditWrite({
      sq_request_id: review.sq_request_id,
      entity_id: review.entity_id,
      entity_type: review.entity_type,
      user_id: review.user_id,
      platform_id: review.platform_id,
      action: `franchise_decision_${decision}`,
      reason:
        decision === 'reject'
          ? (rejection_reason as string)
          : decision === 'escalate'
          ? 'Franchise escalated to EDR for oversight review'
          : `Approved at SQ level ${resolvedSqLevel}`,
      performed_by: reviewed_by,
      sq_level_before: null,
      sq_level_after: decision === 'approve' ? resolvedSqLevel : null,
      decided_by: 'franchise',
    });

    // ── State Mutation ─────────────────────────────────────────────────────

    if (decision === 'approve') {
      await this.sqEngineService.finalizeApproval(
        review.sq_request_id,
        resolvedSqLevel as number,
        'franchise',
      );

      const decisionEvent: SqDecisionEvent = {
        sq_request_id: review.sq_request_id,
        entity_id: review.entity_id,
        entity_type: review.entity_type,
        user_id: review.user_id,
        platform_id: review.platform_id,
        decision: 'approved',
        sq_level: resolvedSqLevel,
        decided_by: 'franchise',
        decided_at: decidedAt,
        rejection_reason: null,
      };
      this.eventEmitter.emit(RULE_ENGINE_EVENTS.DECISION, decisionEvent);

    } else if (decision === 'reject') {
      await this.sqEngineService.finalizeRejection(
        review.sq_request_id,
        rejection_reason as string,
        'franchise',
      );

      const decisionEvent: SqDecisionEvent = {
        sq_request_id: review.sq_request_id,
        entity_id: review.entity_id,
        entity_type: review.entity_type,
        user_id: review.user_id,
        platform_id: review.platform_id,
        decision: 'rejected',
        sq_level: null,
        decided_by: 'franchise',
        decided_at: decidedAt,
        rejection_reason: rejection_reason as string,
      };
      this.eventEmitter.emit(RULE_ENGINE_EVENTS.DECISION, decisionEvent);

    } else {
      // escalate → forward to EDR
      await this.sqEngineService.forwardToReview(
        review.sq_request_id,
        'pending_edr',
      );

      this.eventEmitter.emit(FRANCHISE_EVENTS.EDR_REVIEW, {
        sq_request_id: review.sq_request_id,
        entity_id: review.entity_id,
        entity_type: review.entity_type,
        user_id: review.user_id,
        platform_id: review.platform_id,
        sq_level_calculated: review.sq_level_calculated,
        criteria_met: review.criteria_met,
        total_criteria: review.total_criteria,
      });
    }

    // ── Update FranchiseReview record ──────────────────────────────────────
    const newStatus: 'decided' | 'escalated' =
      decision === 'escalate' ? 'escalated' : 'decided';

    const updatedReview = await this.franchiseReviewModel.findByIdAndUpdate(
      franchise_review_id,
      {
        status: newStatus,
        decision,
        sq_level_assigned: resolvedSqLevel,
        rejection_reason: rejection_reason ?? null,
        reviewer_notes: reviewer_notes ?? null,
        reviewed_by,
        decided_at: decidedAt,
      },
      { new: true },
    );

    // Decrement pending_review_count on the franchise
    await this.franchiseModel.findByIdAndUpdate(
      review.franchise_id,
      { $inc: { pending_review_count: -1 } },
    );

    this.logger.log(
      `Franchise decision: review=${franchise_review_id} sq_request=${review.sq_request_id} decision=${decision} by=${reviewed_by}`,
    );

    return updatedReview as FranchiseReviewDocument;
  }

  // ── Query Methods ────────────────────────────────────────────────────────

  /** Returns all franchises for a platform, sorted by area */
  async getFranchisesForPlatform(platform_id: string): Promise<FranchiseDocument[]> {
    return this.franchiseModel
      .find({ platform_id })
      .sort({ area: 1 })
      .exec();
  }

  /** Returns all pending reviews assigned to a specific franchise */
  async getPendingReviews(franchise_id: string): Promise<FranchiseReviewDocument[]> {
    return this.franchiseReviewModel
      .find({ franchise_id, status: 'pending' })
      .sort({ created_at: 1 })
      .exec();
  }

  /** Returns a single franchise review by id */
  async getReviewById(franchise_review_id: string): Promise<FranchiseReviewDocument | null> {
    return this.franchiseReviewModel.findById(franchise_review_id).exec();
  }

  /** Update franchise contact info (name, email, phone) — admin operation */
  async updateFranchise(
    franchise_id: string,
    patch: {
      franchise_name?: string | null;
      contact_email?: string | null;
      contact_phone?: string | null;
      active?: boolean;
    },
  ): Promise<FranchiseDocument | null> {
    return this.franchiseModel.findByIdAndUpdate(franchise_id, patch, { new: true }).exec();
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Extracts the geographic area from entity_data.
   * Priority: entity_data.area → entity_data.city → 'unknown'
   * Lowercased and trimmed for consistent compound index matching.
   */
  private extractArea(entityData: Record<string, unknown>): string {
    const raw =
      (entityData['area'] as string | undefined) ??
      (entityData['city'] as string | undefined) ??
      'unknown';
    return raw.toString().toLowerCase().trim();
  }

  /** Emits an audit.write event — audit module subscribes and persists it */
  private emitAuditWrite(payload: AuditWriteEvent): void {
    this.eventEmitter.emit(SQ_ENGINE_EVENTS.AUDIT_WRITE, payload);
  }
}
