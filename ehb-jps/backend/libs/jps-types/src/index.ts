// ─── Profile ──────────────────────────────────────────────────────────────────

export type ProfileRole =
  | 'worker'
  | 'employer'
  | 'freelancer'
  | 'trainer'
  | 'recruiter';

export type ProfileStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'resubmit_required';

export interface IProfile {
  _id: string;
  user_id: string;
  role: ProfileRole;
  display_name: string;
  bio?: string;
  role_data: Record<string, unknown>;
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
  status: 'approved' | 'pending' | 'rejected' | 'not_found';
  sq_level: number | null;
  badge_label?: string;
  rejection_reason?: string;
  can_resubmit?: boolean;
}

export interface PssBulkStatusResponse {
  results: Array<{
    entity_id: string;
    sq_level: number | null;
    status: string;
  }>;
}

export interface PssWebhookPayload {
  event: 'sq.decision' | 'sq.under_review';
  entity_id: string;
  platform_id: string;
  decision: 'approved' | 'rejected' | 'conditional';
  sq_level: number | null;
  rejection_reason?: string;
  decided_at: string;
  pss_request_id: string;
}
