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
  }),
  overrideExisting: false,
});

export const {
  useRegisterSellerMutation,
  useGetSellerProfileQuery,
  useUpdateSellerProfileMutation,
  useGetSellerStatsQuery,
  useSubmitSellerToPssMutation,
} = sellerApi;
