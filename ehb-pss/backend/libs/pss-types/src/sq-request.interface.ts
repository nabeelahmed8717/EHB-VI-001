import { SqDecidedBy, SqLevel, SqStatus } from './sq-level.interface';

/**
 * SQ Request — lifecycle record for a single approval flow.
 *
 * Created when a platform submits an entity for SQ approval via POST /sq/submit.
 * Tracks the full journey from submission to final decision.
 * Stored in pss_db.sq_requests.
 */
export interface ISqRequest {
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  entity_data: Record<string, unknown>;  // raw data submitted by platform
  status: SqStatus;
  sq_level: SqLevel | null;
  decided_by?: SqDecidedBy;
  decided_at?: Date;
  rejection_reason?: string | null;
  submitted_at: Date;
  updated_at: Date;
}

/**
 * Routing decisions produced by the rule engine.
 * Based on SQ score vs. platform-configured thresholds.
 */
export type RoutingDecision =
  | 'auto_approve'       // Score meets auto-approve threshold → assign SQ now
  | 'forward_franchise'  // Score in middle range → send to franchise
  | 'forward_edr';       // Score below franchise threshold → escalate to EDR

/** Full routing result from the rule engine */
export interface IRoutingResult {
  decision: RoutingDecision;
  sq_level?: SqLevel;    // Set when decision is auto_approve
  reason: string;        // Always populated — no silent decisions
}

/**
 * Audit log entry — written for every SQ decision, no exceptions.
 * Stored in pss_db.audit_logs.
 */
export interface IAuditLog {
  audit_id: string;
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  action: string;           // e.g. 'sq_submitted', 'sq_approved', 'sq_rejected'
  decided_by?: SqDecidedBy;
  sq_level_before?: SqLevel | null;
  sq_level_after?: SqLevel | null;
  reason: string;           // Always required — no empty reasons
  performed_by?: string;    // userId or 'system' for auto decisions
  created_at: Date;
}
