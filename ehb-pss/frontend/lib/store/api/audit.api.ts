import { baseApi } from './base-api';
import type { AuditLog, PaginatedResponse } from '@/types/pss.types';

interface AuditSearchParams {
  action?: string;
  performed_by?: string;
  platform_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

interface AuditPlatformParams {
  action?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export const auditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLogsByRequest: build.query<AuditLog[], string>({
      query: (sq_request_id) => `/audit/request/${sq_request_id}`,
      providesTags: (_result, _error, id) => [{ type: 'AuditLog', id }],
    }),

    getLogsByEntity: build.query<
      PaginatedResponse<AuditLog>,
      { entity_id: string; platform_id?: string; page?: number; limit?: number }
    >({
      query: ({ entity_id, platform_id, page = 1, limit = 20 }) => {
        const qs = new URLSearchParams();
        if (platform_id) qs.set('platform_id', platform_id);
        qs.set('page', String(page));
        qs.set('limit', String(limit));
        return `/audit/entity/${entity_id}?${qs.toString()}`;
      },
      providesTags: ['AuditLog'],
    }),

    getLogsByPlatform: build.query<
      PaginatedResponse<AuditLog>,
      { platform_id: string } & AuditPlatformParams
    >({
      query: ({ platform_id, ...params }) => {
        const qs = new URLSearchParams();
        if (params.action) qs.set('action', params.action);
        if (params.from_date) qs.set('from_date', params.from_date);
        if (params.to_date) qs.set('to_date', params.to_date);
        qs.set('page', String(params.page ?? 1));
        qs.set('limit', String(params.limit ?? 20));
        return `/audit/platform/${platform_id}?${qs.toString()}`;
      },
      providesTags: ['AuditLog'],
    }),

    searchLogs: build.query<PaginatedResponse<AuditLog>, AuditSearchParams>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params.action) qs.set('action', params.action);
        if (params.performed_by) qs.set('performed_by', params.performed_by);
        if (params.platform_id) qs.set('platform_id', params.platform_id);
        if (params.from_date) qs.set('from_date', params.from_date);
        if (params.to_date) qs.set('to_date', params.to_date);
        qs.set('page', String(params.page ?? 1));
        qs.set('limit', String(params.limit ?? 50));
        return `/audit/search?${qs.toString()}`;
      },
      providesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetLogsByRequestQuery,
  useGetLogsByEntityQuery,
  useGetLogsByPlatformQuery,
  useSearchLogsQuery,
} = auditApi;
