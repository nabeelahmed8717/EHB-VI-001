import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type FranchiseDocument = HydratedDocument<Franchise>;

/**
 * Franchise Schema — pss_db.franchises
 *
 * Represents a PSS-registered franchise office for a given platform + area.
 * Franchises are auto-created (upserted) when the rule-engine routes an entity
 * to franchise review — they are NOT manually registered via an admin form.
 *
 * Uniqueness: one franchise per (platform_id, area). The compound unique index
 * enforces this; MongoDB upsert is used for idempotent auto-creation.
 *
 * Architecture rule (from architecture.md Rule 6):
 *   "Each platform admin configures their own routing rules in PSS."
 *   Franchises are the operational arm that acts on those routing decisions.
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'franchises',
})
export class Franchise {
  // ── Identity ─────────────────────────────────────────────────────────────

  @ApiProperty({
    description: 'Platform this franchise serves',
    example: 'gosellr',
  })
  @Prop({ required: true, index: true })
  platform_id: string;

  @ApiProperty({
    description:
      'Geographic area this franchise covers. Derived from entity_data.area ' +
      '?? entity_data.city ?? "unknown" at time of first routing.',
    example: 'lahore',
  })
  @Prop({ required: true })
  area: string;

  // ── Contact Info ──────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Name of the franchise office or manager (set by admin after auto-creation)',
    example: 'Gosellr Lahore Office',
  })
  @Prop({ type: String, default: null })
  franchise_name: string | null;

  @ApiPropertyOptional({
    description: 'Contact email for franchise communications',
    example: 'lahore@gosellr-franchise.com',
  })
  @Prop({ type: String, default: null })
  contact_email: string | null;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+92-300-0000000',
  })
  @Prop({ type: String, default: null })
  contact_phone: string | null;

  // ── Operational State ─────────────────────────────────────────────────────

  @ApiProperty({
    description:
      'Whether this franchise is active and can receive new review assignments. ' +
      'Inactive franchises are skipped during assignment — review falls back to EDR.',
    example: true,
  })
  @Prop({ required: true, default: true })
  active: boolean;

  @ApiProperty({
    description: 'Count of pending (unresolved) reviews assigned to this franchise',
    example: 3,
  })
  @Prop({ required: true, default: 0 })
  pending_review_count: number;

  @ApiProperty({
    description: 'Total reviews ever assigned to this franchise',
    example: 42,
  })
  @Prop({ required: true, default: 0 })
  total_reviews_assigned: number;

  // ── Timestamps (auto-managed by Mongoose) ─────────────────────────────────
  created_at: Date;
  updated_at: Date;
}

export const FranchiseSchema = SchemaFactory.createForClass(Franchise);

// ── Indexes ───────────────────────────────────────────────────────────────────

/**
 * Compound unique — one franchise per (platform_id, area).
 * This is the key for idempotent upsert: MongoDB will refuse a second insert
 * with the same (platform_id, area), and findOneAndUpdate + upsert=true will
 * update the existing record instead of creating a duplicate.
 */
FranchiseSchema.index({ platform_id: 1, area: 1 }, { unique: true });

/** Lookup active franchises per platform for admin UI */
FranchiseSchema.index({ platform_id: 1, active: 1 });
