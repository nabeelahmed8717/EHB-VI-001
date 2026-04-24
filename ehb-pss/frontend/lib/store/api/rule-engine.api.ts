import { baseApi } from './base-api';
import type { PlatformRule, RuleOperator, RuleAction, SqLevel } from '@/types/pss.types';

interface CreateRuleBody {
  platform_id: string;
  rule_name: string;
  criteria_threshold: number;
  operator: RuleOperator;
  threshold_max?: number | null;
  action: RuleAction;
  sq_level_assigned?: SqLevel | null;
  rejection_reason?: string | null;
  priority: number;
  active?: boolean;
}

type UpdateRuleBody = Partial<CreateRuleBody>;

export const ruleEngineApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRulesByPlatform: build.query<PlatformRule[], string>({
      query: (platform_id) => `/rule-engine/rules/${platform_id}`,
      providesTags: (_result, _error, platform_id) => [
        { type: 'PlatformRule', id: platform_id },
      ],
    }),

    createRule: build.mutation<PlatformRule, CreateRuleBody>({
      query: (body) => ({
        url: '/rule-engine/rules',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'PlatformRule', id: body.platform_id },
      ],
    }),

    updateRule: build.mutation<
      PlatformRule,
      { rule_id: string; platform_id: string; body: UpdateRuleBody }
    >({
      query: ({ rule_id, body }) => ({
        url: `/rule-engine/rules/${rule_id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { platform_id }) => [
        { type: 'PlatformRule', id: platform_id },
      ],
    }),

    deleteRule: build.mutation<
      { deleted: boolean },
      { rule_id: string; platform_id: string }
    >({
      query: ({ rule_id }) => ({
        url: `/rule-engine/rules/${rule_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { platform_id }) => [
        { type: 'PlatformRule', id: platform_id },
      ],
    }),

    toggleRule: build.mutation<
      PlatformRule,
      { rule_id: string; platform_id: string }
    >({
      query: ({ rule_id }) => ({
        url: `/rule-engine/rules/${rule_id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, { platform_id }) => [
        { type: 'PlatformRule', id: platform_id },
      ],
    }),
  }),
});

export const {
  useGetRulesByPlatformQuery,
  useCreateRuleMutation,
  useUpdateRuleMutation,
  useDeleteRuleMutation,
  useToggleRuleMutation,
} = ruleEngineApi;
