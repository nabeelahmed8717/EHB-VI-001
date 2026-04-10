import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type SqRecordDocument = HydratedDocument<SqRecord>;

/**
 * SQ Record Schema — pss_db.sq_records
 *
 * The trust ledger — the source of truth for an entity's current SQ level.
 * One record per (entity_id + platform_id) composite key.
 * Created or updated when a final decision is made (approved / conditional / rejected).
 *
 * Platforms query this collection via GET /sq/status/:entity_id
 * and POST /sq/status/bulk to show SQ badges on their frontends.
 *
 * Architecture rule: SQ is per entity, not per user.
 * Key = user_id + platform_id + entity_id
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'sq_records',
})
export class SqRecord {
  // ── Entity Identity ──────────────────────────────────────────────────────

  @ApiProperty({ description: 'MongoDB ObjectId of the entity' })
  @Prop({ required: true })
  entity_id: string;

  @ApiProperty({ description: 'Type of entity (product, seller_profile, etc.)' })
  @Prop({ required: true })
  entity_type: string;

  @ApiProperty({ description: 'MongoDB ObjectId of the entity owner' })
  @Prop({ required: true })
  user_id: string;

  @ApiProperty({ description: 'Platform this record belongs to' })
  @Prop({ required: true })
  platform_id: string;

  // ── SQ Assignment ────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Assigned SQ level — null until approved or conditional',
    enum: [1, 2, 3, 5, 7, 10],
    nullable: true,
  })
  @Prop({ type: Number, default: null })
  sq_level: number | null;

  @ApiProperty({
    description: 'Current status of this entity\'s SQ record',
    enum: ['pending', 'pending_franchise', 'pending_edr', 'approved', 'conditional', 'rejected'],
  })
  @Prop({
    type: String,
    enum: ['pending', 'pending_franchise', 'pending_edr', 'approved', 'conditional', 'rejected'],
    required: true,
    default: 'pending',
  })
  status: string;

  @ApiPropertyOptional({ description: 'Human-readable SQ badge label for frontend display' })
  @Prop({ type: String, default: null })
  badge_label: string | null;

  // ── Approval Details ─────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Timestamp when SQ level was assigned' })
  @Prop({ type: Date, default: null })
  approved_at: Date | null;

  @ApiPropertyOptional({
    description: 'Expiry for time-limited SQ assignments — null means no expiry',
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  expires_at: Date | null;

  // ── Rejection Details ────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Rejection reason — always populated on rejected status' })
  @Prop({ type: String, default: null })
  rejection_reason: string | null;

  @ApiPropertyOptional({ description: 'Timestamp when the record was rejected' })
  @Prop({ type: Date, default: null })
  rejected_at: Date | null;

  @ApiPropertyOptional({ description: 'Whether the entity is eligible to resubmit for SQ' })
  @Prop({ type: Boolean, default: true })
  can_resubmit: boolean;

  // ── Timestamps (auto-managed by Mongoose) ────────────────────────────────
  created_at: Date;
  updated_at: Date;
}

export const SqRecordSchema = SchemaFactory.createForClass(SqRecord);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Composite unique — one SQ record per entity per platform (the trust ledger rule)
SqRecordSchema.index({ entity_id: 1, platform_id: 1 }, { unique: true });
// Bulk status lookup — GET /sq/status/bulk queries by platform + entity list
SqRecordSchema.index({ platform_id: 1, entity_id: 1 });
// User history queries across platforms
SqRecordSchema.index({ user_id: 1, platform_id: 1 });
