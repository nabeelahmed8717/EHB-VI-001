export type EhbPlatform = 'gosellr' | 'jps' | 'hps' | 'ols' | 'wms' | 'obs';

export type ProfileRole =
  | 'seller' | 'buyer' | 'rider' | 'chef' | 'driver'
  | 'cleaner' | 'electrician' | 'plumber' | 'trainer'
  | 'worker' | 'employer' | 'freelancer' | 'recruiter'
  | 'doctor' | 'nurse' | 'lawyer' | 'teacher' | 'other';

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
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}
