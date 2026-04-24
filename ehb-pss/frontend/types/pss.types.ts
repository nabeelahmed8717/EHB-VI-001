// ── SQ Level ──────────────────────────────────────────────────────────────────

export const SQ_LEVELS = [1, 2, 3, 5, 7, 10] as const;
export type SqLevel = typeof SQ_LEVELS[number];

// ── SQ Status ─────────────────────────────────────────────────────────────────

export type SqStatus =
  | 'pending'
  | 'pending_franchise'
  | 'pending_edr'
  | 'approved'
  | 'conditional'
  | 'rejected';

// ── Platform ──────────────────────────────────────────────────────────────────

export type PlatformStatus = 'active' | 'suspended' | 'pending';

export interface Platform {
  _id: string;
  platform_id: string;
  platform_name: string;
  api_key: string;
  webhook_url: string;
  webhook_secret: string;
  entity_types: string[];
  contact_email: string;
  status: PlatformStatus;
  created_at: string;
  updated_at: string;
}

// ── SQ Request ────────────────────────────────────────────────────────────────

export interface SqRequest {
  _id: string;
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  entity_data: Record<string, unknown>;
  status: SqStatus;
  sq_level_calculated: SqLevel | null;
  criteria_met: number;
  total_criteria: number;
  assigned_franchise_id: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── SQ Record ─────────────────────────────────────────────────────────────────

export interface SqRecord {
  _id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  sq_level: SqLevel;
  status: 'approved' | 'conditional' | 'rejected';
  decided_by: 'auto' | 'franchise' | 'edr';
  decided_at: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ── Franchise ─────────────────────────────────────────────────────────────────

export type FranchiseStatus = 'active' | 'suspended' | 'inactive';
export type FranchiseDecision = 'approve' | 'reject' | 'escalate';
export type FranchiseReviewStatus = 'pending' | 'decided' | 'escalated';

export interface Franchise {
  _id: string;
  platform_id: string;
  area: string;
  region: string;
  status: FranchiseStatus;
  pending_review_count: number;
  total_reviews_assigned: number;
  created_at: string;
  updated_at: string;
}

export interface FranchiseReview {
  _id: string;
  sq_request_id: string;
  franchise_id: string;
  platform_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  status: FranchiseReviewStatus;
  decision: FranchiseDecision | null;
  sq_level_assigned: SqLevel | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── EDR Review ────────────────────────────────────────────────────────────────

export type EdrSource = 'rule_engine' | 'franchise_escalation' | 'override';
export type EdrDecisionStatus = 'pending' | 'approved' | 'conditional' | 'rejected';

export interface EdrReview {
  _id: string;
  sq_request_id: string;
  platform_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  source: EdrSource;
  decision: EdrDecisionStatus;
  sq_level_assigned: SqLevel | null;
  rejection_reason: string | null;
  override_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EdrFullDetail {
  sq_request: SqRequest;
  sq_record: SqRecord | null;
  franchise_review: FranchiseReview | null;
  edr_reviews: EdrReview[];
  audit_trail: AuditLog[];
}

// ── Criteria ──────────────────────────────────────────────────────────────────

export type CheckType = 'presence' | 'min_length' | 'min_value' | 'regex';

export interface Criterion {
  id: string;
  label: string;
  field_key: string;
  required: boolean;
  sq_min: SqLevel;
  check_type: CheckType;
  check_value: string | number | null;
}

export interface CriteriaSet {
  _id: string;
  platform_id: string;
  entity_type: string;
  criteria: Criterion[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Platform Rule ─────────────────────────────────────────────────────────────

export type RuleOperator = 'gte' | 'lte' | 'eq' | 'between';
export type RuleAction = 'auto_approve' | 'franchise' | 'edr' | 'reject';

export interface PlatformRule {
  _id: string;
  platform_id: string;
  rule_name: string;
  criteria_threshold: number;
  operator: RuleOperator;
  threshold_max: number | null;
  action: RuleAction;
  sq_level_assigned: SqLevel | null;
  rejection_reason: string | null;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS = [
  'sq_submitted',
  'sq_auto_approved',
  'sq_rule_rejected',
  'sq_forwarded_franchise',
  'sq_forwarded_edr',
  'no_rule_matched',
  'rule_engine_error',
  'franchise_assigned',
  'franchise_decision_approve',
  'franchise_decision_reject',
  'franchise_decision_escalate',
  'edr_assigned',
  'edr_decision_approved',
  'edr_decision_conditional',
  'edr_decision_rejected',
  'edr_edited_request',
  'edr_override',
  'webhook_queued',
  'webhook_delivered',
  'webhook_failed',
] as const;

export type AuditAction = typeof AUDIT_ACTIONS[number];

export interface AuditLog {
  _id: string;
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  action: AuditAction | string;
  reason: string;
  performed_by: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── Webhook Delivery ──────────────────────────────────────────────────────────

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

export interface WebhookDelivery {
  _id: string;
  sq_request_id: string;
  platform_id: string;
  payload: Record<string, unknown>;
  webhook_url: string;
  status: DeliveryStatus;
  attempts: number;
  last_attempt_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ── API Response wrappers ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export interface DashboardStats {
  pending_sq_requests: number;
  pending_edr_reviews: number;
  pending_franchise_reviews: number;
  total_platforms: number;
}
