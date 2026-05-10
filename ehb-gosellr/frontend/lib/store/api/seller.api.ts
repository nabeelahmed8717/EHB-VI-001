import { baseApi } from './base-api';

export interface SellerProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  business_category: string;
  store_description: string;
  store_logo_url: string | null;
  bank_info: {
    bank_name: string;
    account_title: string;
    account_number: string;
    iban: string;
  } | null;
  document_urls: string[];
  sq_status: string;
  sq_level: number | null;
  sq_badge_label: string | null;
  sq_request_id: string | null;
  sq_decided_at: string | null;
  sq_rejection_reason: string | null;
  is_active: boolean;
  jps_profile_id: string | null;
  jps_profile_linked_at: string | null;
}

interface CreateSellerProfileBody {
  business_name: string;
  business_type: string;
  business_category: string;
  store_description?: string;
}

interface UpdateSellerProfileBody {
  business_name?: string;
  business_type?: string;
  business_category?: string;
  store_description?: string;
  store_logo_url?: string;
  document_urls?: string[];
  bank_info?: {
    bank_name: string;
    account_title: string;
    account_number: string;
    iban: string;
  };
}

interface SellerStats {
  sq_status: string;
  sq_level: number | null;
  sq_badge_label: string | null;
  is_active: boolean;
}

interface PssSubmitResult {
  sq_status: string;
  sq_request_id: string | null;
}

// ── JPS profile types ────────────────────────────────────────────────────────

export interface EligibleJpsProfile {
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

/** Full JPS profile object — what JPS returns from GET /profiles/:id */
export interface LinkedJpsProfile {
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

interface AttachJpsBody {
  jps_profile_id: string;
}

export const sellerApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    registerSeller: build.mutation<SellerProfile, CreateSellerProfileBody>({
      query: (body) => ({ url: '/seller/register', method: 'POST', body }),
      invalidatesTags: ['Seller'],
    }),
    getSellerProfile: build.query<SellerProfile | null, void>({
      query: () => '/seller/profile',
      providesTags: ['Seller'],
    }),
    updateSellerProfile: build.mutation<SellerProfile, UpdateSellerProfileBody>({
      query: (body) => ({ url: '/seller/profile', method: 'PATCH', body }),
      invalidatesTags: ['Seller'],
    }),
    getSellerStats: build.query<SellerStats, void>({
      query: () => '/seller/stats',
      providesTags: ['Seller'],
    }),
    submitSellerToPss: build.mutation<PssSubmitResult, void>({
      query: () => ({ url: '/seller/pss-submit', method: 'POST' }),
      invalidatesTags: ['Seller'],
    }),

    // ── JPS profile linkage ──────────────────────────────────────────────────
    getEligibleJpsProfiles: build.query<EligibleJpsProfile[], void>({
      query: () => '/seller/jps-profile/eligible',
      providesTags: ['Seller'],
    }),
    getLinkedJpsProfile: build.query<LinkedJpsProfile | null, void>({
      query: () => '/seller/jps-profile',
      providesTags: ['Seller'],
    }),
    attachJpsProfile: build.mutation<SellerProfile, AttachJpsBody>({
      query: (body) => ({ url: '/seller/jps-profile/attach', method: 'POST', body }),
      invalidatesTags: ['Seller', 'Product'],
    }),
    autoAttachLatestJpsProfile: build.mutation<SellerProfile, void>({
      query: () => ({ url: '/seller/jps-profile/return', method: 'POST' }),
      invalidatesTags: ['Seller', 'Product'],
    }),
    unlinkJpsProfile: build.mutation<SellerProfile, void>({
      query: () => ({ url: '/seller/jps-profile', method: 'DELETE' }),
      invalidatesTags: ['Seller', 'Product'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterSellerMutation,
  useGetSellerProfileQuery,
  useUpdateSellerProfileMutation,
  useGetSellerStatsQuery,
  useSubmitSellerToPssMutation,
  useGetEligibleJpsProfilesQuery,
  useGetLinkedJpsProfileQuery,
  useAttachJpsProfileMutation,
  useAutoAttachLatestJpsProfileMutation,
  useUnlinkJpsProfileMutation,
} = sellerApi;
