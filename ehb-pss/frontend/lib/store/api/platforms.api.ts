import { baseApi } from './base-api';
import type { Platform, PlatformStatus, WebhookDelivery } from '@/types/pss.types';

interface RegisterPlatformBody {
  platform_id: string;
  platform_name: string;
  webhook_url: string;
  entity_types: string[];
  contact_email: string;
}

interface UpdateWebhookBody {
  webhook_url: string;
}

interface UpdateStatusBody {
  status: PlatformStatus;
}

interface RotateKeyResponse {
  api_key: string;
  message: string;
}

interface RegisterResponse {
  success: boolean;
  platform_api_key: string;
  message: string;
  platform: Platform;
}

export const platformsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllPlatforms: build.query<Platform[], void>({
      query: () => '/platforms',
      providesTags: ['Platform'],
    }),

    getPlatformById: build.query<Platform, string>({
      query: (platform_id) => `/platforms/${platform_id}`,
      providesTags: (_result, _error, id) => [{ type: 'Platform', id }],
    }),

    registerPlatform: build.mutation<RegisterResponse, RegisterPlatformBody>({
      query: (body) => ({
        url: '/platforms/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Platform'],
    }),

    updateWebhook: build.mutation<
      Platform,
      { platform_id: string; body: UpdateWebhookBody }
    >({
      query: ({ platform_id, body }) => ({
        url: `/platforms/${platform_id}/webhook`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { platform_id }) => [
        { type: 'Platform', id: platform_id },
      ],
    }),

    updateStatus: build.mutation<
      Platform,
      { platform_id: string; body: UpdateStatusBody }
    >({
      query: ({ platform_id, body }) => ({
        url: `/platforms/${platform_id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { platform_id }) => [
        { type: 'Platform', id: platform_id },
        'Platform',
      ],
    }),

    rotateKey: build.mutation<RotateKeyResponse, string>({
      query: (platform_id) => ({
        url: `/platforms/${platform_id}/rotate-key`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, platform_id) => [
        { type: 'Platform', id: platform_id },
      ],
    }),

    getWebhookDeliveries: build.query<
      WebhookDelivery[],
      { platform_id: string; limit?: number }
    >({
      query: ({ platform_id, limit = 10 }) =>
        `/webhooks/deliveries/${platform_id}?limit=${limit}`,
      providesTags: ['WebhookDelivery'],
    }),

    sendTestPing: build.mutation<
      { ok: boolean; status: number; message: string },
      string
    >({
      query: (platform_id) => ({
        url: `/webhooks/test/${platform_id}`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetAllPlatformsQuery,
  useGetPlatformByIdQuery,
  useRegisterPlatformMutation,
  useUpdateWebhookMutation,
  useUpdateStatusMutation,
  useRotateKeyMutation,
  useGetWebhookDeliveriesQuery,
  useSendTestPingMutation,
} = platformsApi;
