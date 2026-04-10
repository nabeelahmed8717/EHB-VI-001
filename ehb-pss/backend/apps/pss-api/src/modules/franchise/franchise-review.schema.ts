import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type FranchiseReviewDocument = HydratedDocument<FranchiseReview>;

/**
 * Valid decisions a franchise reviewer can make.
 *
 *   approve   → entity passes franchise review; SQ level assigned
 *   reject    → entity fails; rejection_reason required
 *   escalate  → franchise escalates to EDR for oversight (optional path)
 */
export type FranchiseDecision = 'approve' | 'reject' | 'escalate';

/**
 * Review status lifecycle.
 *
 *   pending    → assigned, waiting for franchise reviewer action
 *   decided    → franchise has submitted approve/reject/escalate
 *   escalated  → forwarded to EDR after franchise escalation
 */
export type FranchiseReviewStatus = 'pending' | 'decided' | 'escalated';

/**
 * Franchise Review Schema — pss_db.franchise_reviews
 *
 * One record per entity routed to franchise review.
 * Created automatically when rule-engine emits 'franchise.review_requested'.
 * Franchise staff read these records via the controller and then submit a decision.
 *
 * Idempotency: unique index on sq_request_id ensures exactly one review
 * record per SQ request. If the event fires twice (e.g. duplicate emit), the
 * second upsert updates the existing record rather than creating a duplicate.
 *
 * Architecture rule (from architecture.md Rule 4):
 *   "Audit every SQ decision" — franchise decisions are audited via audit.write
 *   BEFORE the sq_request record is finalized.
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'franchise_reviews',
})
export class FranchiseReview {
  // ── Links to SQ Request ──────────────────────────────────────────────────

  @ApiProperty({
    description: 'Reference to the originating sq_request (MongoDB ObjectId as string)',
    example: '665f1e2a4b3c2a1d0e9f8b7a',
  })
  @Prop({ required: true, index: true })
  sq_request_id: string;

  @ApiProperty({
    description: 'Reference to the franchise assigned to review this entity',
    example: '665f1e2a4b3c2a1d0e9f8b99',
  })
  @Prop({ required: true, index: true })
  franchise_id: string;

  // ── Entity Context (denormalized for franchise staff UI) ─────────────────

  @ApiProperty({ description: 'Entity being reviewed', example: 'prod_abc123' })
  @Prop({ required: true })
  entity_id: string;

  @ApiProperty({ description: 'Entity type', example: 'product' })
  @Prop({ required: true })
  entity_type: string;

  @ApiProperty({ description: 'Platform this review belongs to', example: 'gosellr' })
  @Prop({ required: true, index: true })
  platform_id: string;

  @ApiProperty({ description: 'User who submitted the entity for SQ scoring', example: 'usr_123' })
  @Prop({ required: true })
  user_id: string;

  // ── Scoring Context (denormalized for franchise staff UI) ────────────────

  @ApiProperty({
    description:
      'Calculated SQ level from sq-engine scoring. ' +
      'Franchise uses this as a reference when deciding — they can approve at this level ' +
      'or assign a different level based on their review.',
    example: 5,
    nullable: true,
  })
  @Prop({ type: Number, default: null })
  sq_level_calculated: number | null;

  @ApiProperty({
    description: 'Number of criteria the entity met during sq-engine scoring',
    example: 4,
  })
  @Prop({ required: true, default: 0 })
  criteria_met: number;

  @ApiProperty({
    description: 'Total criteria in the platform\'s criteria set',
    example: 6,
  })
  @Prop({ required: true, default: 0 })
  total_criteria: number;

  // ── Review State ─────────────────────────────────────────────────────────

  @ApiProperty({
    enum: ['pending', 'decided', 'escalated'],
    description: 'Current state of this franchise review',
    example: 'pending',
  })
  @Prop({
    type: String,
    enum: ['pending', 'decided', 'escalated'],
    required: true,
    default: 'pending',
  })
  status: FranchiseReviewStatus;

  // ── Decision Fields (null until decided) ─────────────────────────────────

  @ApiPropertyOptional({
    enum: ['approve', 'reject', 'escalate'],
    description: 'Decision submitted by franchise reviewer. Null until decided.',
    example: 'approve',
    nullable: true,
  })
  @Prop({
    type: String,
    enum: ['approve', 'reject', 'escalate', null],
    default: null,
  })
  decision: FranchiseDecision | null;

  @ApiPropertyOptional({
    description:
      'SQ level assigned on approval. Defaults to sq_level_calculated if omitted by reviewer. ' +
      'Null if decision is reject or escalate.',
    example: 5,
    nullable: true,
  })
  @Prop({ type: Number, default: null })
  sq_level_assigned: number | null;

  @ApiPropertyOptional({
    description:
      'Required when decision=reject. Logged in audit_logs and returned to platform webhook.',
    example: 'Physical inspection failed — product condition mismatch',
    nullable: true,
  })
  @Prop({ type: String, default: null })
  rejection_reason: string | null;

  @ApiPropertyOptional({
    description: 'Internal notes from the franchise reviewer (not sent to platform webhook)',
    example: 'Product images do not match seller description. See attached photos.',
    nullable: true,
  })
  @Prop({ type: String, default: null })
  reviewer_notes: string | null;

  // ── Reviewer Identity ─────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description:
      'Identifier of the franchise staff member who made the decision. ' +
      'Set when decision is submitted. Null until then.',
    example: 'franchise_staff_007',
    nullable: true,
  })
  @Prop({ type: String, default: null })
  reviewed_by: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp when the franchise decision was submitted',
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  decided_at: Date | null;

  // ── Timestamps (auto-managed by Mongoose) ─────────────────────────────────
  created_at: Date;
  updated_at: Date;
}

export const FranchiseReviewSchema = SchemaFactory.createForClass(FranchiseReview);

// ── Indexes ───────────────────────────────────────────────────────────────────

/**
 * Unique on sq_request_id — one review record per SQ request.
 * Idempotent upsert guard: if franchise.review_requested fires twice for the
 * same request, the second findOneAndUpdate+upsert touches the same document.
 */
FranchiseReviewSchema.index({ sq_request_id: 1 }, { unique: true });

/** Query: load pending reviews for a franchise (staff queue UI) */
FranchiseReviewSchema.index({ franchise_id: 1, status: 1, created_at: 1 });

/** Query: load all reviews for a platform (admin oversight) */
FranchiseReviewSchema.index({ platform_id: 1, status: 1 });
