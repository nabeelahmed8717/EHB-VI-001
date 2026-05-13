import { baseApi } from './base-api';

export interface RiderProfile {
  id: string;
  user_id: string;
  cnic: string;
  vehicle_type: 'bike' | 'motorcycle' | 'car' | 'van' | 'truck';
  license_plate: string;
  availability_zone: string;
  availability: 'online' | 'offline' | 'on_delivery';
  cnic_front_url: string | null;
  cnic_back_url: string | null;
  vehicle_photo_url: string | null;
  driving_license_url: string | null;
  document_urls: string[];
  sq_status: string;
  sq_level: number | null;
  sq_badge_label: string | null;
  is_active: boolean;
  jps_profile_id: string | null;
  jps_profile_linked_at: string | null;
}

// ── JPS profile types ────────────────────────────────────────────────────────

export interface EligibleRiderJpsProfile {
  id: string;
  platform: string;
  role: string;
  display_name: string;
  bio: string;
  status:
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'resubmit_required';
  sq_level: number | null;
  already_linked: boolean;
  linked_to_me: boolean;
}

export interface LinkedRiderJpsProfile {
  _id: string;
  platform: string;
  role: string;
  display_name: string;
  bio: string;
  description: string;
  status:
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'resubmit_required';
  sq_level: number | null;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AttachRiderJpsBody {
  jps_profile_id: string;
}

interface CreateRiderProfileBody {
  cnic: string;
  vehicle_type: 'bike' | 'motorcycle' | 'car' | 'van' | 'truck';
  license_plate: string;
  availability_zone: string;
}

interface UpdateRiderProfileBody {
  vehicle_type?: string;
  license_plate?: string;
  availability_zone?: string;
  cnic_front_url?: string;
  cnic_back_url?: string;
  vehicle_photo_url?: string;
  driving_license_url?: string;
  document_urls?: string[];
}

interface SetAvailabilityBody {
  availability: 'online' | 'offline' | 'on_delivery';
}

export const riderApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    registerRider: build.mutation<RiderProfile, CreateRiderProfileBody>({
      query: (body) => ({ url: '/rider/register', method: 'POST', body }),
      invalidatesTags: ['Rider'],
    }),
    getRiderProfile: build.query<RiderProfile | null, void>({
      query: () => '/rider/profile',
      providesTags: ['Rider'],
    }),
    updateRiderProfile: build.mutation<RiderProfile, UpdateRiderProfileBody>({
      query: (body) => ({ url: '/rider/profile', method: 'PATCH', body }),
      invalidatesTags: ['Rider'],
    }),
    setRiderAvailability: build.mutation<{ availability: string }, SetAvailabilityBody>({
      query: (body) => ({ url: '/rider/availability', method: 'PATCH', body }),
      invalidatesTags: ['Rider'],
    }),
    getRiderStats: build.query<{ sq_status: string; sq_level: number | null; sq_badge_label: string | null; availability: string; is_active: boolean }, void>({
      query: () => '/rider/stats',
      providesTags: ['Rider'],
    }),

    // ── JPS profile linkage ──────────────────────────────────────────────────
    getEligibleRiderJpsProfiles: build.query<EligibleRiderJpsProfile[], void>({
      query: () => '/rider/jps-profile/eligible',
      providesTags: ['Rider'],
    }),
    getLinkedRiderJpsProfile: build.query<LinkedRiderJpsProfile | null, void>({
      query: () => '/rider/jps-profile',
      providesTags: ['Rider'],
    }),
    attachRiderJpsProfile: build.mutation<RiderProfile, AttachRiderJpsBody>({
      query: (body) => ({ url: '/rider/jps-profile/attach', method: 'POST', body }),
      invalidatesTags: ['Rider'],
    }),
    autoAttachLatestRiderJpsProfile: build.mutation<RiderProfile, void>({
      query: () => ({ url: '/rider/jps-profile/return', method: 'POST' }),
      invalidatesTags: ['Rider'],
    }),
    unlinkRiderJpsProfile: build.mutation<RiderProfile, void>({
      query: () => ({ url: '/rider/jps-profile', method: 'DELETE' }),
      invalidatesTags: ['Rider'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterRiderMutation,
  useGetRiderProfileQuery,
  useUpdateRiderProfileMutation,
  useSetRiderAvailabilityMutation,
  useGetRiderStatsQuery,
  useGetEligibleRiderJpsProfilesQuery,
  useGetLinkedRiderJpsProfileQuery,
  useAttachRiderJpsProfileMutation,
  useAutoAttachLatestRiderJpsProfileMutation,
  useUnlinkRiderJpsProfileMutation,
} = riderApi;
