import { baseApi } from './base-api';

export type DeliveryRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface DeliveryRequest {
  id: string;
  order_id: string;
  seller_id: string;
  rider_user_id: string;
  rider_jps_profile_id: string;
  rider_display_name: string;
  status: DeliveryRequestStatus;
  requested_at: string;
  expires_at: string;
  responded_at: string | null;
  reject_reason: string | null;
  delivery_fee: number;
}

export type RiderAvailability = 'online' | 'offline' | 'on_delivery';

export interface AvailableRider {
  jps_profile_id: string;
  rider_user_id: string;
  display_name: string;
  bio: string;
  sq_level: number | null;
  sq_badge_label: string | null;
  is_verified: boolean;
  availability: RiderAvailability;
  availability_zone: string | null;
  vehicle_type: string | null;
}

export const deliveryRequestsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
      // ── Seller ──────────────────────────────────────────────────────────
      getAvailableRiders: build.query<AvailableRider[], string>({
        query: (orderId) => `/orders/${orderId}/available-riders`,
        providesTags: (_r, _e, orderId) => [{ type: 'AvailableRiders', id: orderId }],
      }),
      getActiveDeliveryRequest: build.query<DeliveryRequest | null, string>({
        query: (orderId) => `/orders/${orderId}/delivery-requests/active`,
        providesTags: (_r, _e, orderId) => [{ type: 'DeliveryRequest', id: orderId }],
      }),
      sendDeliveryRequest: build.mutation<
        DeliveryRequest,
        { orderId: string; riderJpsProfileId: string; riderUserId: string }
      >({
        query: ({ orderId, riderJpsProfileId, riderUserId }) => ({
          url: `/orders/${orderId}/delivery-requests`,
          method: 'POST',
          body: {
            rider_jps_profile_id: riderJpsProfileId,
            rider_user_id: riderUserId,
          },
        }),
        invalidatesTags: (_r, _e, { orderId }) => [
          { type: 'DeliveryRequest', id: orderId },
          { type: 'AvailableRiders', id: orderId },
          'Order',
        ],
      }),
      cancelDeliveryRequest: build.mutation<DeliveryRequest, { id: string; orderId: string }>({
        query: ({ id }) => ({
          url: `/delivery-requests/${id}/cancel`,
          method: 'POST',
        }),
        invalidatesTags: (_r, _e, { orderId }) => [
          { type: 'DeliveryRequest', id: orderId },
          'Order',
        ],
      }),

      // ── Rider ───────────────────────────────────────────────────────────
      getPendingDeliveryRequests: build.query<DeliveryRequest[], void>({
        query: () => '/delivery-requests/pending',
        providesTags: [{ type: 'DeliveryRequest', id: 'PENDING_LIST' }],
      }),
      acceptDeliveryRequest: build.mutation<DeliveryRequest, string>({
        query: (id) => ({ url: `/delivery-requests/${id}/accept`, method: 'POST' }),
        invalidatesTags: (result) => [
          { type: 'DeliveryRequest', id: 'PENDING_LIST' },
          ...(result ? [{ type: 'DeliveryRequest' as const, id: result.order_id }] : []),
          'Order',
        ],
      }),
      rejectDeliveryRequest: build.mutation<
        DeliveryRequest,
        { id: string; reason?: string }
      >({
        query: ({ id, reason }) => ({
          url: `/delivery-requests/${id}/reject`,
          method: 'POST',
          body: reason ? { reason } : {},
        }),
        invalidatesTags: [{ type: 'DeliveryRequest', id: 'PENDING_LIST' }],
      }),
  }),
  overrideExisting: false,
});

export const {
  useGetAvailableRidersQuery,
  useGetActiveDeliveryRequestQuery,
  useSendDeliveryRequestMutation,
  useCancelDeliveryRequestMutation,
  useGetPendingDeliveryRequestsQuery,
  useAcceptDeliveryRequestMutation,
  useRejectDeliveryRequestMutation,
} = deliveryRequestsApi;
