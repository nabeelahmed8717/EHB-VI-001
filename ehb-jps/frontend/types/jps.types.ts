export type ProfileRole = 'worker' | 'employer' | 'freelancer' | 'trainer' | 'recruiter';

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
  bio: string;
  role_data: Record<string, unknown>;
  status: ProfileStatus;
  sq_level: number | null;
  pss_request_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}
