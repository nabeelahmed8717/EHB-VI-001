import { baseApi } from './base-api';
import type {
  Franchise,
  FranchiseReview,
  PaginatedResponse,
  SqLevel,
} from '@/types/pss.types';

interface GetFranchisesParams {
  platform_id?: string;
  page?: number;
  limit?: number;
}

interface FranchiseDecisionBody {
  decision: 'approve' | 'reject' | 'escalate';
  sq_level_assigned?: SqLevel;
  rejection_reason?: string;
  reviewed_by: string;
}

export const franchiseApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllFranchises: build.query<PaginatedResponse<Franchise>, GetFranchisesParams>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params.platform_id) qs.set('platform_id', params.platform_id);
        qs.set('page', String(params.page ?? 1));
        qs.set('limit', String(params.limit ?? 20));
        return `/franchise?${qs.toString()}`;
      },
      providesTags: ['Franchise'],
    }),

    getFranchiseById: build.query<Franchise, string>({
      query: (franchise_id) => `/franchise/${franchise_id}`,
      providesTags: (_result, _error, id) => [{ type: 'Franchise', id }],
    }),

    getFranchiseQueue: build.query<FranchiseReview[], string>({
      query: (franchise_id) => `/franchise/${franchise_id}/queue`,
      providesTags: (_result, _error, id) => [
        { type: 'FranchiseReview', id },
        'FranchiseReview',
      ],
    }),

    submitFranchiseDecision: build.mutation<
      FranchiseReview,
      { sq_request_id: string; body: FranchiseDecisionBody }
    >({
      query: ({ sq_request_id, body }) => ({
        url: `/franchise/decide/${sq_request_id}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FranchiseReview', 'Franchise', 'SqRequest'],
    }),
  }),
});

export const {
  useGetAllFranchisesQuery,
  useGetFranchiseByIdQuery,
  useGetFranchiseQueueQuery,
  useSubmitFranchiseDecisionMutation,
} = franchiseApi;
