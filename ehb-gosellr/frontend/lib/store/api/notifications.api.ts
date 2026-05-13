import { baseApi } from './base-api';

export type NotificationType =
  | 'order:created'
  | 'order:confirmed'
  | 'order:ready_for_delivery'
  | 'order:rider_assigned'
  | 'order:picked'
  | 'order:out_for_delivery'
  | 'order:delivered'
  | 'order:cancelled'
  | 'delivery_request:new'
  | 'delivery_request:accepted'
  | 'delivery_request:rejected'
  | 'delivery_request:expired'
  | 'delivery_request:cancelled'
  | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<AppNotification[], { limit?: number; unread?: boolean } | void>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.limit) qs.set('limit', String(params.limit));
        if (params?.unread) qs.set('unread', 'true');
        const s = qs.toString();
        return `/notifications${s ? `?${s}` : ''}`;
      },
      providesTags: ['Notification'],
    }),
    unreadNotificationCount: build.query<{ count: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['NotificationCount'],
    }),
    markNotificationRead: build.mutation<AppNotification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification', 'NotificationCount'],
    }),
    markAllNotificationsRead: build.mutation<{ updated: number }, void>({
      query: () => ({ url: `/notifications/read-all`, method: 'POST' }),
      invalidatesTags: ['Notification', 'NotificationCount'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListNotificationsQuery,
  useUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
