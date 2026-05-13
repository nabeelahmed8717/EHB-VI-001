'use client';

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/lib/store';
import type { Socket } from 'socket.io-client';
import { baseApi } from '@/lib/store/api/base-api';

type DeliveryRequestEvent =
  | 'delivery_request:new'
  | 'delivery_request:accepted'
  | 'delivery_request:rejected'
  | 'delivery_request:expired'
  | 'delivery_request:cancelled';

interface DeliveryRequestPayload {
  id: string;
  order_id: string;
  seller_id: string;
  rider_user_id: string;
  rider_display_name: string;
  status: string;
  delivery_fee: number;
  expires_at: string;
}

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

interface UseOrdersSocketOptions {
  /** Called when a brand-new delivery request arrives in the rider's inbox. */
  onDeliveryRequestNew?: (p: DeliveryRequestPayload) => void;
  /** Called for any delivery_request:* event (after cache invalidation). */
  onDeliveryRequestEvent?: (event: DeliveryRequestEvent, p: DeliveryRequestPayload) => void;
  /** Called on every order:updated event. */
  onOrderUpdated?: (p: { order_id: string; status: string }) => void;
  /** Called when a new notification lands in the bell. */
  onNotification?: (p: NotificationPayload) => void;
}

/**
 * Subscribes the current authenticated user to their `/orders` WS room and
 * automatically invalidates the relevant RTK Query caches whenever a
 * delivery_request:* event or order:updated event arrives.
 *
 * Returns nothing — it just runs side effects for the lifetime of the page
 * that mounted it. Drop it on any page that wants live updates.
 */
export function useOrdersSocket(opts: UseOrdersSocketOptions = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const token = useSelector((s: RootState) => s.auth.token);
  const socketRef = useRef<Socket | null>(null);
  // Stash callbacks in a ref so the socket effect doesn't re-create on every render.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const { io } = await import('socket.io-client');
        if (cancelled) return;

        const apiUrl =
          process.env.NEXT_PUBLIC_GOSELLR_API_URL ?? 'http://localhost:3002/api';
        const wsUrl = apiUrl.replace('/api', '');
        const socket = io(`${wsUrl}/orders`, {
          transports: ['websocket'],
          auth: { token },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          // Gateway's @MessageBody expects { user_id: string } — passing a
          // bare string puts the client in `user:undefined` and no push ever
          // arrives. This was the live-update bug.
          socket.emit('join:user', { user_id: user.id });
        });

        const invalidateForRequest = (p: DeliveryRequestPayload) => {
          dispatch(
            baseApi.util.invalidateTags([
              { type: 'DeliveryRequest', id: 'PENDING_LIST' },
              { type: 'DeliveryRequest', id: p.order_id },
              { type: 'AvailableRiders', id: p.order_id },
              { type: 'Order', id: p.order_id },
              'Order',
            ]),
          );
        };

        const events: DeliveryRequestEvent[] = [
          'delivery_request:new',
          'delivery_request:accepted',
          'delivery_request:rejected',
          'delivery_request:expired',
          'delivery_request:cancelled',
        ];
        for (const evt of events) {
          socket.on(evt, (payload: DeliveryRequestPayload) => {
            invalidateForRequest(payload);
            optsRef.current.onDeliveryRequestEvent?.(evt, payload);
            if (evt === 'delivery_request:new') {
              optsRef.current.onDeliveryRequestNew?.(payload);
            }
          });
        }

        socket.on('order:updated', (payload: { order_id: string; status: string }) => {
          dispatch(
            baseApi.util.invalidateTags([
              { type: 'Order', id: payload.order_id },
              'Order',
            ]),
          );
          optsRef.current.onOrderUpdated?.(payload);
        });

        socket.on('notification:new', (payload: NotificationPayload) => {
          // Refresh the bell badge and the inbox list on every arrival.
          dispatch(
            baseApi.util.invalidateTags(['Notification', 'NotificationCount']),
          );
          optsRef.current.onNotification?.(payload);
        });
      } catch {
        // socket.io-client missing — page falls back to manual refetch.
      }
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token, dispatch]);
}
