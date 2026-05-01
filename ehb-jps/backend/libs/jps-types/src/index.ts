// ─── EHB Platforms ────────────────────────────────────────────────────────────

export const EHB_PLATFORMS = [
  { id: 'gosellr', label: 'GoSellr — Marketplace' },
  { id: 'jps',     label: 'JPS — Job Providing Service' },
  { id: 'hps',     label: 'HPS — Healthcare Platform' },
  { id: 'ols',     label: 'OLS — Legal Marketplace' },
  { id: 'wms',     label: 'WMS — Hospital Management' },
  { id: 'obs',     label: 'OBS — Book Retail' },
] as const;

export type EhbPlatform = 'gosellr' | 'jps' | 'hps' | 'ols' | 'wms' | 'obs';

// ─── Profile Roles ────────────────────────────────────────────────────────────

export const PROFILE_ROLES = [
  { value: 'seller',      label: 'Seller' },
  { value: 'buyer',       label: 'Buyer' },
  { value: 'rider',       label: 'Rider / Delivery' },
  { value: 'chef',        label: 'Chef / Cook' },
  { value: 'driver',      label: 'Driver' },
  { value: 'cleaner',     label: 'Cleaner' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber',     label: 'Plumber' },
  { value: 'trainer',     label: 'Trainer / Instructor' },
  { value: 'worker',      label: 'Worker' },
  { value: 'employer',    label: 'Employer' },
  { value: 'freelancer',  label: 'Freelancer' },
  { value: 'recruiter',   label: 'Recruiter' },
  { value: 'doctor',      label: 'Doctor' },
  { value: 'nurse',       label: 'Nurse' },
  { value: 'lawyer',      label: 'Lawyer' },
  { value: 'teacher',     label: 'Teacher' },
  { value: 'other',       label: 'Other' },
] as const;

export type ProfileRole =
  | 'seller' | 'buyer' | 'rider' | 'chef' | 'driver'
  | 'cleaner' | 'electrician' | 'plumber' | 'trainer'
  | 'worker' | 'employer' | 'freelancer' | 'recruiter'
  | 'doctor' | 'nurse' | 'lawyer' | 'teacher' | 'other';

// ─── Profile Status ───────────────────────────────────────────────────────────

export type ProfileStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'resubmit_required';

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface IProfile {
  _id: string;
  user_id: string;
  platform: EhbPlatform;
  role: ProfileRole;
  display_name: string;
  bio: string;
  description: string;
  cnic_front: string | null;
  cnic_back: string | null;
  address: string;
  address_proof: string | null;
  status: ProfileStatus;
  sq_level: number | null;
  pss_request_id: string | null;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IJpsUser {
  _id: string;
  ehb_user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  token_version: number;
  created_at: Date;
}

// ─── PSS ──────────────────────────────────────────────────────────────────────

export interface PssSubmitResponse {
  success: boolean;
  pss_request_id?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface PssSqStatusResponse {
  entity_id: string;
  platform_id: string;
  /**
   * 'approved' | 'conditional'            — final approval states (sq_record exists)
   * 'rejected'                             — final rejection state
   * 'pending'                              — just submitted, scoring in progress
   * 'pending_franchise' | 'pending_edr'   — routed to manual review
   * 'not_found'                            — no record in PSS at all
   */
  status:
    | 'approved'
    | 'conditional'
    | 'rejected'
    | 'pending'
    | 'pending_franchise'
    | 'pending_edr'
    | 'not_found';
  sq_level: number | null;
  badge_label?: string;
  rejection_reason?: string;
  can_resubmit?: boolean;
  /** Present when status is pending_edr or pending_franchise */
  pending_at?: string;
  message?: string;
}

export interface PssBulkStatusResponse {
  results: Array<{ entity_id: string; sq_level: number | null; status: string }>;
}

/** sq.decision — final approval or rejection */
export interface PssWebhookDecisionPayload {
  event: 'sq.decision';
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  decision: 'approved' | 'rejected';
  sq_level: number | null;
  decided_by: 'auto' | 'franchise' | 'edr';
  decided_at: string;
  rejection_reason: string | null;
}

/** sq.under_review — routed to Franchise or EDR for manual review */
export interface PssWebhookUnderReviewPayload {
  event: 'sq.under_review';
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  routed_to: 'franchise' | 'edr';
  queued_at: string;
}

/** Union of all PSS → platform webhook event shapes */
export type PssWebhookPayload = PssWebhookDecisionPayload | PssWebhookUnderReviewPayload;
