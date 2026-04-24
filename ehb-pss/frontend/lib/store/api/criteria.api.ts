import { baseApi } from './base-api';
import type { CriteriaSet, Criterion } from '@/types/pss.types';

interface GetCriteriaParams {
  platform_id: string;
  entity_type?: string;
}

interface CreateCriteriaSetBody {
  platform_id: string;
  entity_type: string;
  criteria: Omit<Criterion, 'id'>[];
}

interface UpdateCriteriaSetBody {
  criteria?: Criterion[];
  active?: boolean;
}

export const criteriaApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCriteriaByPlatform: build.query<CriteriaSet[], GetCriteriaParams>({
      query: ({ platform_id, entity_type }) => {
        const qs = new URLSearchParams();
        if (entity_type) qs.set('entity_type', entity_type);
        return `/criteria/${platform_id}?${qs.toString()}`;
      },
      providesTags: (_result, _error, { platform_id }) => [
        { type: 'CriteriaSet', id: platform_id },
      ],
    }),

    createCriteriaSet: build.mutation<CriteriaSet, CreateCriteriaSetBody>({
      query: (body) => ({
        url: '/criteria',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'CriteriaSet', id: body.platform_id },
      ],
    }),

    updateCriteriaSet: build.mutation<
      CriteriaSet,
      { criteria_set_id: string; platform_id: string; body: UpdateCriteriaSetBody }
    >({
      query: ({ criteria_set_id, body }) => ({
        url: `/criteria/${criteria_set_id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { platform_id }) => [
        { type: 'CriteriaSet', id: platform_id },
      ],
    }),
  }),
});

export const {
  useGetCriteriaByPlatformQuery,
  useCreateCriteriaSetMutation,
  useUpdateCriteriaSetMutation,
} = criteriaApi;
