import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type EdrReviewDocument = HydratedDocument<EdrReview>;

/**
 * How a request arrived at EDR:
 *   rule_engine           — platform rule had action=edr; rule-engine emitted edr.review_requested
 *   franchise_escalation  — franchise staff submitted decision=escalate
 *   override              — EDR re-opened a previously decided request to re-decide it
 */
export type EdrSource = 'rule_engine' | 'franchise_escalation' | 'override';

/**
 * EDR decision states.
 *   pending     — assigned, awaiting EDR staff action
 *   approved    — EDR approved at the assigned SQ level
 *   conditional — EDR approved with conditions (same flow as approved, different badge label)
 *   rejected    — EDR rejected; rejection_reason required
 */
export type EdrDecision = 'pending' | 'approved' | 'conditional' | 'rejected';

/**
 * EDR Review Schema — pss_db.edr_reviews
 *
 * One record per SQ request assigned to EDR.
 * EDR is EHB-level oversight — it operates across ALL platforms.
 *
 * Lifecycle:
 *   edr.review_requested → EdrReview created (status=pending)
 *   POST /edr/review/:id/decide → status updated (approved|conditional|rejected)
 *   POST /edr/review/:id/override → new EdrReview created (source=override)
 *
 * Idempotency: unique index on sq_request_id guards against duplicate creation
 * from duplicate events. Override creates a NEW record (no unique constraint on override).
 *
 * Architecture rule (working-rules.md Rule 4):
 *   "Audit every SQ decision" — EDR decisions emit audit.write BEFORE finalization.
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'edr_reviews',
})
export class EdrReview {
  // ── Links to SQ Request ───────────────────────────────────────────────────

  @ApiProperty({
    description: 'Reference to the originating SqRequest (MongoDB ObjectId as string)',
    example: '665f1e2a4b3c2a1d0e9f8b7a',
  })
  @Prop({ required: true, index: true })
  sq_request_id: string;

  @ApiPropertyOptional({
    description:
      'Reference to the FranchiseReview that was escalated, if source=franchise_escalation. ' +
      'Null for rule_engine or override sources.',
    nullable: true,
    example: '665f1e2a4b3c2a1d0e9f8c11',
  })
  @Prop({ type: String, default: null })
  franchise_review_id: string | null;

  // ── Entity Context (denormalized for EDR staff UI) ─────────────────────────

  @ApiProperty({ description: 'Platform this request belongs to', example: 'gosellr' })
  @Prop({ required: true, index: true })
  platform_id: string;

  @ApiProperty({ description: 'Entity being reviewed', example: 'prod_abc123' })
  @Prop({ required: true })
  entity_id: string;

  @ApiProperty({ description: 'Entity type', example: 'product' })
  @Prop({ required: true })
  entity_type: string;

  @ApiProperty({ description: 'User who submitted the entity for SQ scoring', example: 'usr_123' })
  @Prop({ required: true })
  user_id: string;

  // ── Source ────────────────────────────────────────────────────────────────

  @ApiProperty({
    enum: ['rule_engine', 'franchise_escalation', 'override'],
    description:
      'How this EDR review was created. ' +
      'rule_engine = rule-engine routed directly to EDR. ' +
      'franchise_escalation = franchise escalated. ' +
      'override = EDR re-opened a previously decided request.',
    example: 'franchise_escalation',
  })
  @Prop({
    type: String,
    enum: ['rule_engine', 'franchise_escalation', 'override'],
    required: true,
  })
  source: EdrSource;

  // ── Decision ──────────────────────────────────────────────────────────────

  @ApiProperty({
    enum: ['pending', 'approved', 'conditional', 'rejected'],
    description: 'Current decision state. Starts as pending.',
    example: 'pending',
  })
  @Prop({
    type: String,
    enum: ['pending', 'approved', 'conditional', 'rejected'],
    required: true,
    default: 'pending',
    index: true,
  })
  decision: EdrDecision;

  @ApiPropertyOptional({
    description:
      'SQ level assigned on approve or conditional. ' +
      'EDR can assign any valid SQ level — not bound by sq_level_calculated.',
    enum: [1, 2, 3, 5, 7, 10],
    nullable: true,
    example: 7,
  })
  @Prop({ type: Number, default: null })
  sq_level_assigned: number | null;

  @ApiPropertyOptional({
    description: 'Required when decision=rejected. Logged in audit and sent to platform webhook.',
    example: 'Entity does not meet minimum legal compliance criteria',
    nullable: true,
  })
  @Prop({ type: String, default: null })
  rejection_reason: string | null;

  // ── EDR-Specific Fields ───────────────────────────────────────────────────

  @ApiPropertyOptional({
    description:
      'If EDR edited entity_data before deciding, the edited version is stored here. ' +
      'The original entity_data remains unchanged on SqRequest. ' +
      'EDR scores against the edited data when making a decision.',
    nullable: true,
  })
  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  edited_entity_data: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description:
      'Required when source=override — EDR must justify why they are overriding a prior decision. ' +
      'Also available for non-override decisions as an optional notes field.',
    example: 'Platform admin appeal approved — re-evaluating after seller provided compliance docs',
    nullable: true,
  })
  @Prop({ type: String, default: null })
  override_notes: string | null;

  // ── Reviewer ──────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'EDR staff member who made the final decision. Null until decided.',
    example: 'edr_staff_001',
    nullable: true,
  })
  @Prop({ type: String, default: null })
  reviewed_by: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp when the EDR decision was submitted.',
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  reviewed_at: Date | null;

  // ── Timestamps (auto-managed by Mongoose) ─────────────────────────────────
  created_at: Date;
  updated_at: Date;
}

export const EdrReviewSchema = SchemaFactory.createForClass(EdrReview);

// ── Indexes ───────────────────────────────────────────────────────────────────

/**
 * Partial unique index: unique on sq_request_id only when source != 'override'.
 * Override records intentionally allow multiple EdrReviews per sq_request_id.
 * This MongoDB partial index enforces the constraint only on non-override rows.
 */
EdrReviewSchema.index(
  { sq_request_id: 1 },
  {
    unique: true,
    partialFilterExpression: { source: { $in: ['rule_engine', 'franchise_escalation'] } },
  },
);

/** Staff queue: pending reviews across all platforms, oldest first */
EdrReviewSchema.index({ decision: 1, created_at: 1 });

/** Platform-filtered queue */
EdrReviewSchema.index({ platform_id: 1, decision: 1, created_at: 1 });

/** History lookup by entity */
EdrReviewSchema.index({ sq_request_id: 1, created_at: -1 });
