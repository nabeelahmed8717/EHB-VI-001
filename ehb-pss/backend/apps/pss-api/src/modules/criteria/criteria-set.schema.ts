import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type CriteriaSetDocument = HydratedDocument<CriteriaSet>;

/**
 * How to evaluate entity_data[field_key]:
 *
 *   presence   — field is non-null and non-empty (any type)
 *   min_length — string or array length >= check_value
 *   min_value  — numeric value >= check_value
 *   regex      — string matches check_value pattern
 */
export type CriterionCheckType = 'presence' | 'min_length' | 'min_value' | 'regex';

/**
 * A single criterion within a criteria set.
 * Stored as a subdocument inside CriteriaSet.criteria[].
 */
export class Criterion {
  @ApiProperty({ description: 'Short identifier — "c1", "c2", ...', example: 'c1' })
  id: string;

  @ApiProperty({ description: 'Human-readable label shown in UI', example: 'Product Title' })
  label: string;

  @ApiProperty({
    description:
      'Key in entity_data to evaluate. ' +
      'e.g. field_key="title" → checks entity_data.title. ' +
      'If absent, falls back to entity_data[criterion.id].',
    example: 'title',
  })
  field_key: string;

  @ApiProperty({
    description: 'If true, failing this criterion is a hard blocker regardless of overall score.',
    example: false,
  })
  required: boolean;

  @ApiProperty({
    description:
      'Minimum SQ level this criterion must be satisfied for. ' +
      'Criterion is only evaluated when the entity is targeting sq_min or higher.',
    enum: [1, 2, 3, 5, 7, 10],
    example: 1,
  })
  sq_min: number;

  @ApiProperty({
    enum: ['presence', 'min_length', 'min_value', 'regex'],
    description:
      'presence   — value is non-null, non-empty. ' +
      'min_length — string/array length >= check_value. ' +
      'min_value  — numeric >= check_value. ' +
      'regex      — string matches check_value pattern.',
    example: 'presence',
  })
  check_type: CriterionCheckType;

  @ApiPropertyOptional({
    description:
      'Threshold for min_length / min_value (Number), or pattern string for regex. ' +
      'Not used for check_type=presence.',
    example: 3,
    nullable: true,
  })
  check_value: string | number | null;
}

// Mongoose subdocument schema for Criterion (no separate _id)
const CriterionSchema = new MongooseSchema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    field_key: { type: String, required: true },
    required: { type: Boolean, default: false },
    sq_min: { type: Number, required: true },
    check_type: {
      type: String,
      enum: ['presence', 'min_length', 'min_value', 'regex'],
      required: true,
      default: 'presence',
    },
    check_value: { type: MongooseSchema.Types.Mixed, default: null },
  },
  { _id: false },
);

/**
 * Criteria Set Schema — pss_db.criteria_sets
 *
 * Each platform configures one criteria set per entity_type.
 * sq-engine loads this set at submission time to score the entity.
 *
 * Uniqueness: compound unique index on (platform_id, entity_type).
 * One criteria set per entity type per platform — no duplicates.
 *
 * Soft-delete: set active=false via DELETE endpoint.
 * sq-engine only loads active criteria sets.
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'criteria_sets',
})
export class CriteriaSet {
  @ApiProperty({ description: 'Platform this criteria set belongs to', example: 'gosellr' })
  @Prop({ required: true, index: true })
  platform_id: string;

  @ApiProperty({
    description: 'Entity type this criteria set applies to',
    example: 'product',
  })
  @Prop({ required: true })
  entity_type: string;

  @ApiProperty({
    description: 'Ordered list of criteria. sq-engine evaluates each in sequence.',
    type: [Object],
  })
  @Prop({ type: [CriterionSchema], default: [] })
  criteria: Criterion[];

  @ApiProperty({
    description:
      'Whether this criteria set is active. ' +
      'sq-engine ignores inactive sets (entity scores 0 criteria).',
    example: true,
  })
  @Prop({ required: true, default: true })
  active: boolean;

  // Timestamps (auto-managed by Mongoose)
  created_at: Date;
  updated_at: Date;
}

export const CriteriaSetSchema = SchemaFactory.createForClass(CriteriaSet);

// ── Indexes ───────────────────────────────────────────────────────────────────

/** One criteria set per (platform_id, entity_type) — enforced at DB level */
CriteriaSetSchema.index({ platform_id: 1, entity_type: 1 }, { unique: true });

/** Active criteria sets per platform — primary query pattern */
CriteriaSetSchema.index({ platform_id: 1, active: 1 });
