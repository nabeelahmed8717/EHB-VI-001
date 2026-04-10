import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type PlatformRuleDocument = HydratedDocument<PlatformRule>;

/**
 * Valid operators for rule threshold matching.
 *
 *   gte     → criteria_met >= criteria_threshold
 *   lte     → criteria_met <= criteria_threshold
 *   eq      → criteria_met === criteria_threshold
 *   between → criteria_met >= criteria_threshold
 *             AND criteria_met <= threshold_max
 */
export type RuleOperator = 'gte' | 'lte' | 'eq' | 'between';

/**
 * Routing actions that a rule can trigger.
 *
 *   auto_approve → assign SQ level immediately, emit sq.decision
 *   franchise    → forward to franchise for manual review
 *   edr          → forward to EDR for oversight review
 *   reject       → reject entity, emit sq.decision with rejection_reason
 */
export type RuleAction = 'auto_approve' | 'franchise' | 'edr' | 'reject';

/**
 * Platform Rule Schema — pss_db.platform_rules
 *
 * Admin-configured routing rules per platform.
 * Each platform has its own rule set — no global rules shared across platforms.
 *
 * Rules are evaluated in ascending priority order (1 = highest priority).
 * First matching rule wins — no further rules are evaluated.
 *
 * Architecture rule (from architecture.md Rule 6):
 *   "Each platform admin configures their own routing rules in PSS."
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'platform_rules',
})
export class PlatformRule {
  // ── Rule Identity ────────────────────────────────────────────────────────

  @ApiProperty({
    description: 'Platform this rule applies to',
    example: 'gosellr',
  })
  @Prop({ required: true, index: true })
  platform_id: string;

  @ApiProperty({
    description: 'Human-readable rule name for admin UI',
    example: 'Auto-approve high scorers',
  })
  @Prop({ required: true })
  rule_name: string;

  // ── Match Condition ──────────────────────────────────────────────────────

  @ApiProperty({
    description: 'Criteria count threshold to match against criteria_met from sq-engine',
    example: 4,
  })
  @Prop({ required: true })
  criteria_threshold: number;

  @ApiProperty({
    enum: ['gte', 'lte', 'eq', 'between'],
    description:
      'Comparison operator: gte (>=), lte (<=), eq (===), between (criteria_threshold..threshold_max)',
    example: 'gte',
  })
  @Prop({
    type: String,
    enum: ['gte', 'lte', 'eq', 'between'],
    required: true,
  })
  operator: RuleOperator;

  @ApiPropertyOptional({
    description:
      'Upper bound for "between" operator. Required when operator=between.',
    example: 7,
  })
  @Prop({ type: Number, default: null })
  threshold_max: number | null;

  // ── Routing Action ───────────────────────────────────────────────────────

  @ApiProperty({
    enum: ['auto_approve', 'franchise', 'edr', 'reject'],
    description: 'Action to take when this rule matches',
    example: 'auto_approve',
  })
  @Prop({
    type: String,
    enum: ['auto_approve', 'franchise', 'edr', 'reject'],
    required: true,
  })
  action: RuleAction;

  @ApiPropertyOptional({
    description:
      'SQ level to assign when action=auto_approve. ' +
      'If omitted, falls back to sq_level_calculated from the scoring event.',
    enum: [1, 2, 3, 5, 7, 10],
    example: 5,
  })
  @Prop({ type: Number, default: null })
  sq_level_assigned: number | null;

  @ApiPropertyOptional({
    description:
      'Rejection reason logged in audit_logs when action=reject. Required if action=reject.',
    example: 'Insufficient criteria met for any SQ level',
  })
  @Prop({ type: String, default: null })
  rejection_reason: string | null;

  // ── Priority & State ─────────────────────────────────────────────────────

  @ApiProperty({
    description:
      'Evaluation order — lower number = evaluated first. ' +
      'Ties are broken by created_at (older rule wins).',
    example: 10,
  })
  @Prop({ required: true, default: 100 })
  priority: number;

  @ApiProperty({
    description: 'Inactive rules are skipped during evaluation.',
    example: true,
  })
  @Prop({ required: true, default: true })
  active: boolean;

  // ── Timestamps (auto-managed by Mongoose) ────────────────────────────────
  created_at: Date;
  updated_at: Date;
}

export const PlatformRuleSchema = SchemaFactory.createForClass(PlatformRule);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Primary query: load all active rules for a platform sorted by priority
PlatformRuleSchema.index({ platform_id: 1, active: 1, priority: 1 });
// Admin list query: all rules for a platform
PlatformRuleSchema.index({ platform_id: 1, priority: 1 });
