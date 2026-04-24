import { baseApi } from './base-api';
import type { SqRequest, SqRecord, PaginatedResponse } from '@/types/pss.types';

interface GetPendingRequestsParams {
  platform_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface BulkStatusRequest {
  entity_ids: string[];
  platform_id: string;
}

interface BulkStatusResult {
  entity_id: string;
  sq_level: number | null;
  status: string;
}

export const sqApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRequestById: build.query<SqRequest, string>({
      query: (sq_request_id) => `/sq/requests/${sq_request_id}`,
      providesTags: (_result, _error, id) => [{ type: 'SqRequest', id }],
    }),

    getPendingRequests: build.query<PaginatedResponse<SqRequest>, GetPendingRequestsParams>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params.platform_id) qs.set('platform_id', params.platform_id);
        if (params.status) qs.set('status', params.status);
        qs.set('page', String(params.page ?? 1));
        qs.set('limit', String(params.limit ?? 20));
        return `/sq/requests?${qs.toString()}`;
      },
      providesTags: ['SqRequest'],
    }),

    getBulkSqStatus: build.mutation<{ results: BulkStatusResult[] }, BulkStatusRequest>({
      query: (body) => ({
        url: '/sq/status/bulk',
        method: 'POST',
        body,
      }),
    }),

    getSqRecord: build.query<SqRecord | null, { entity_id: string; platform_id: string }>({
      query: ({ entity_id, platform_id }) =>
        `/sq/status/${entity_id}?platform_id=${platform_id}`,
      providesTags: (_result, _error, { entity_id }) => [
        { type: 'SqRecord', id: entity_id },
      ],
    }),
  }),
});

export const {
  useGetRequestByIdQuery,
  useGetPendingRequestsQuery,
  useGetBulkSqStatusMutation,
  useGetSqRecordQuery,
} = sqApi;
