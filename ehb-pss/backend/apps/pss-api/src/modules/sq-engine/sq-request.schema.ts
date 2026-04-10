import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type SqRequestDocument = HydratedDocument<SqRequest>;

/**
 * SQ Request Schema — pss_db.sq_requests
 *
 * Lifecycle record for a single SQ approval flow.
 * Created by sq-engine on submit. Updated by rule-engine, franchise, and EDR
 * as the request moves through the approval pipeline.
 *
 * One SqRequest maps to exactly one SqRecord once a final decision is made.
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'sq_requests',
})
export class SqRequest {
  // ── Entity Identity ──────────────────────────────────────────────────────

  @ApiProperty({ description: 'MongoDB ObjectId of the entity being evaluated' })
  @Prop({ required: true, index: true })
  entity_id: string;

  @ApiProperty({ description: 'Type of entity (product, seller_profile, etc.)' })
  @Prop({ required: true })
  entity_type: string;

  @ApiProperty({ description: 'MongoDB ObjectId of the entity owner' })
  @Prop({ required: true, index: true })
  user_id: string;

  @ApiProperty({ description: 'Platform ID that submitted this request' })
  @Prop({ required: true, index: true })
  platform_id: string;

  // ── Submitted Data ───────────────────────────────────────────────────────

  @ApiProperty({ description: 'Raw entity data submitted by the platform for evaluation' })
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  entity_data: Record<string, unknown>;

  // ── Scoring Results ──────────────────────────────────────────────────────

  @ApiProperty({ description: 'Number of criteria the entity satisfied' })
  @Prop({ required: true, default: 0 })
  criteria_met: number;

  @ApiProperty({ description: 'Total number of criteria in the platform criteria set' })
  @Prop({ required: true, default: 0 })
  total_criteria: number;

  @ApiProperty({ description: 'Score as a percentage: (criteria_met / total_criteria) * 100' })
  @Prop({ required: true, default: 0 })
  sq_score: number;

  @ApiPropertyOptional({ description: 'SQ level calculated from score — null if below minimum threshold' })
  @Prop({ type: Number, default: null })
  sq_level_calculated: number | null;

  // ── Status & Decision ────────────────────────────────────────────────────

  @ApiProperty({
    enum: ['pending', 'pending_franchise', 'pending_edr', 'approved', 'conditional', 'rejected'],
    description: 'Current status of this SQ approval request',
  })
  @Prop({
    type: String,
    enum: ['pending', 'pending_franchise', 'pending_edr', 'approved', 'conditional', 'rejected'],
    default: 'pending',
    index: true,
  })
  status: string;

  @ApiPropertyOptional({
    enum: ['auto', 'franchise', 'edr'],
    description: 'Who made the final decision — populated after rule-engine, franchise, or EDR acts',
  })
  @Prop({
    type: String,
    enum: ['auto', 'franchise', 'edr'],
    default: null,
  })
  decided_by: string | null;

  @ApiPropertyOptional({ description: 'Required when status is rejected — never null on a rejection' })
  @Prop({ type: String, default: null })
  rejection_reason: string | null;

  @ApiPropertyOptional({ description: 'Timestamp when a final decision was recorded' })
  @Prop({ type: Date, default: null })
  decided_at: Date | null;

  // ── Review Routing ───────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description:
      'MongoDB ObjectId (as string) of the Franchise document assigned to review this request. ' +
      'Populated by FranchiseService when franchise.review_requested is handled. ' +
      'Null until franchise routing occurs.',
    nullable: true,
  })
  @Prop({ type: String, default: null })
  assigned_franchise_id: string | null;

  // ── Timestamps (auto-managed by Mongoose) ────────────────────────────────
  created_at: Date;
  updated_at: Date;
}

export const SqRequestSchema = SchemaFactory.createForClass(SqRequest);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Fast lookup when rule-engine / franchise / EDR query by request context
SqRequestSchema.index({ entity_id: 1, platform_id: 1 });
// Status-based queries (admin dashboard, pending queues)
SqRequestSchema.index({ platform_id: 1, status: 1 });
// User-level history queries
SqRequestSchema.index({ user_id: 1, platform_id: 1, status: 1 });
