import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type AuditLogDocument = HydratedDocument<AuditLog>;

/**
 * Complete registry of action strings emitted across PSS modules.
 * Every audit.write event uses one of these values for `action`.
 *
 * sq-engine:
 *   sq_submitted           — entity submitted for SQ evaluation
 *
 * rule-engine:
 *   sq_auto_approved       — rule matched with action=auto_approve
 *   sq_rule_rejected       — rule matched with action=reject
 *   sq_forwarded_franchise — rule matched with action=franchise
 *   sq_forwarded_edr       — rule matched with action=edr
 *   no_rule_matched        — no platform rule matched the score
 *   rule_engine_error      — unhandled exception in rule evaluation
 *
 * franchise:
 *   franchise_assigned        — franchise office assigned to review
 *   franchise_decision_approve   — franchise approved
 *   franchise_decision_reject    — franchise rejected
 *   franchise_decision_escalate  — franchise escalated to EDR
 *
 * edr:
 *   edr_assigned           — EDR review created (from rule_engine or franchise_escalation)
 *   edr_decision_approved  — EDR approved
 *   edr_decision_conditional — EDR conditional approval
 *   edr_decision_rejected  — EDR rejected
 *   edr_edited_request     — EDR edited entity_data before deciding
 *   edr_override           — EDR re-opened and re-decided a prior decision
 *
 * webhook:
 *   webhook_queued         — sq.decision received, delivery job enqueued in Bull
 *   webhook_delivered      — platform returned 2xx, delivery confirmed
 *   webhook_failed         — all retries exhausted, delivery permanently failed
 */
export const AUDIT_ACTIONS = [
  // sq-engine
  'sq_submitted',
  // rule-engine
  'sq_auto_approved',
  'sq_rule_rejected',
  'sq_forwarded_franchise',
  'sq_forwarded_edr',
  'no_rule_matched',
  'rule_engine_error',
  // franchise
  'franchise_assigned',
  'franchise_decision_approve',
  'franchise_decision_reject',
  'franchise_decision_escalate',
  // edr
  'edr_assigned',
  'edr_decision_approved',
  'edr_decision_conditional',
  'edr_decision_rejected',
  'edr_edited_request',
  'edr_override',
  // webhook
  'webhook_queued',
  'webhook_delivered',
  'webhook_failed',
] as const;

export type AuditAction = typeof AUDIT_ACTIONS[number];

/**
 * Audit Log Schema — pss_db.audit_logs
 *
 * Immutable append-only record of every significant event in the SQ pipeline.
 * Written exclusively by AuditService.writeLog() via the audit.write event.
 *
 * Architecture rule (architecture.md Rule 4 + Rule 8):
 *   "Audit every SQ decision" — no silent decisions, no silent rejections.
 *   Every approve, reject, forward, escalate, and override writes a log entry.
 *
 * Immutability guarantee:
 *   - No update or delete endpoints exist on this schema.
 *   - Documents are created with MongoDB's default _id (immutable).
 *   - created_at is set at write time and never changed.
 */
@Schema({
  // Use custom created_at only — no updatedAt (immutable records)
  timestamps: false,
  collection: 'audit_logs',
})
export class AuditLog {
  // ── SQ Request Context ────────────────────────────────────────────────────

  @ApiProperty({
    description: 'Reference to the SqRequest that triggered this log entry',
    example: '665f1e2a4b3c2a1d0e9f8b7a',
  })
  @Prop({ required: true, index: true })
  sq_request_id: string;

  @ApiProperty({
    description: 'Entity being evaluated',
    example: 'prod_abc123',
  })
  @Prop({ required: true, index: true })
  entity_id: string;

  @ApiProperty({ description: 'Type of entity', example: 'product' })
  @Prop({ required: true })
  entity_type: string;

  @ApiProperty({ description: 'Entity owner', example: 'usr_456' })
  @Prop({ required: true, index: true })
  user_id: string;

  @ApiProperty({ description: 'Platform this event belongs to', example: 'gosellr' })
  @Prop({ required: true, index: true })
  platform_id: string;

  // ── Event Details ─────────────────────────────────────────────────────────

  @ApiProperty({
    description: 'Action identifier — one of the AUDIT_ACTIONS registry values. ' +
      'Unknown actions are accepted to allow future extension without a schema migration.',
    example: 'sq_auto_approved',
  })
  @Prop({ required: true, index: true })
  action: string;

  @ApiProperty({
    description:
      'Human-readable reason for this action. ' +
      'Never null — every audit event must explain why it happened.',
    example: 'Score 80% met criteria threshold for auto_approve rule "Tier1AutoApprove"',
  })
  @Prop({ required: true })
  reason: string;

  @ApiProperty({
    description:
      '"system" for automated actions (rule-engine, sq-engine). ' +
      'franchise_id or edr_staff_id for manual decisions.',
    example: 'system',
  })
  @Prop({ required: true })
  performed_by: string;

  // ── Optional Structured Context ───────────────────────────────────────────

  @ApiPropertyOptional({
    description:
      'Optional extra context persisted with this log entry. ' +
      'AuditService folds sq_level_before, sq_level_after, decided_by from ' +
      'the AuditWriteEvent into this field automatically. ' +
      'Callers may also pass arbitrary metadata for debugging.',
    example: { sq_level_before: null, sq_level_after: 5, decided_by: 'auto' },
    nullable: true,
  })
  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  metadata: Record<string, unknown> | null;

  // ── Timestamp (immutable, set at write time) ──────────────────────────────

  @ApiProperty({
    description:
      'Exact timestamp when this log entry was written. ' +
      'Descending index enables efficient recent-activity queries.',
  })
  @Prop({ required: true, default: () => new Date() })
  created_at: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// ── Indexes ───────────────────────────────────────────────────────────────────

/**
 * Primary query pattern: full audit trail for one SQ request (chronological).
 * GET /audit/request/:sq_request_id → { sq_request_id: 1, created_at: 1 }
 */
AuditLogSchema.index({ sq_request_id: 1, created_at: 1 });

/**
 * Entity history across all SQ requests on a platform.
 * GET /audit/entity/:entity_id?platform_id=
 */
AuditLogSchema.index({ entity_id: 1, platform_id: 1, created_at: -1 });

/**
 * User activity audit — all decisions affecting a user's entities.
 * GET /audit/user/:user_id?platform_id=
 */
AuditLogSchema.index({ user_id: 1, platform_id: 1, created_at: -1 });

/**
 * Platform-level audit dashboard.
 * GET /audit/platform/:platform_id?action=&from_date=&to_date=
 */
AuditLogSchema.index({ platform_id: 1, action: 1, created_at: -1 });

/**
 * Cross-platform search — action + performed_by + date range.
 * GET /audit/search?action=&performed_by=&from_date=&to_date=
 */
AuditLogSchema.index({ action: 1, performed_by: 1, created_at: -1 });

/** Global recent-activity sort — used as a fallback for dashboards */
AuditLogSchema.index({ created_at: -1 });
