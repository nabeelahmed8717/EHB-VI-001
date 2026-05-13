'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Package, Truck, MapPin, AlertCircle, XCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import {
  useListNotificationsQuery,
  useUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  type AppNotification,
  type NotificationType,
} from '@/lib/store/api/notifications.api';

interface Props {
  /** Tint for the focus ring / badge — defaults to accent. */
  accent?: 'accent' | 'success' | 'warning';
  /** Visual size. Compact for sidebars, default for navbars. */
  size?: 'sm' | 'md';
}

const ICONS: Record<NotificationType, typeof Bell> = {
  'order:created': Package,
  'order:confirmed': Check,
  'order:ready_for_delivery': Package,
  'order:rider_assigned': Truck,
  'order:picked': Truck,
  'order:out_for_delivery': MapPin,
  'order:delivered': CheckCheck,
  'order:cancelled': XCircle,
  'delivery_request:new': Bell,
  'delivery_request:accepted': Check,
  'delivery_request:rejected': XCircle,
  'delivery_request:expired': AlertCircle,
  'delivery_request:cancelled': XCircle,
  system: AlertCircle,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

/**
 * Universal notification bell — drops into any layout (seller, rider, buyer).
 *
 * Renders a bell with an unread count badge. Click opens a dropdown showing
 * the most recent 20 notifications. Click a notification to mark it read and
 * navigate (if it has a link). "Mark all read" clears the badge in one shot.
 *
 * Live updates come from the existing /orders WebSocket — useOrdersSocket
 * already invalidates the Notification + NotificationCount tags on every
 * `notification:new` push.
 */
export function NotificationBell({ accent = 'accent', size = 'md' }: Props) {
  const isAuthed = useSelector((s: RootState) => s.auth.isAuthenticated);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: count } = useUnreadNotificationCountQuery(undefined, { skip: !isAuthed });
  const { data: items = [], isFetching } = useListNotificationsQuery(
    { limit: 20 },
    { skip: !isAuthed || !open },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!isAuthed) return null;

  const unread = count?.count ?? 0;
  const sizeCls = size === 'sm'
    ? 'w-8 h-8 text-muted-foreground'
    : 'w-10 h-10 text-foreground';
  const badgeCls = `absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${
    accent === 'success' ? 'bg-success-600' :
    accent === 'warning' ? 'bg-warning-500' : 'bg-accent'
  }`;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className={`${sizeCls} flex items-center justify-center rounded-full bg-surface-alt hover:bg-surface-muted transition-colors relative`}
      >
        <Bell className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
        {unread > 0 && (
          <span className={badgeCls}>{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[92vw] bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-bold text-foreground text-sm">Notifications</p>
            <button
              onClick={async () => { try { await markAllRead().unwrap(); } catch { /* noop */ } }}
              disabled={markingAll || unread === 0}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isFetching && items.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-6 text-center">Loading…</p>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-muted-foreground">
                <Bell className="w-7 h-7 mx-auto opacity-30 mb-2" />
                <p className="text-xs">No notifications yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    n={n}
                    onClick={async () => {
                      if (!n.read) {
                        try { await markRead(n.id).unwrap(); } catch { /* noop */ }
                      }
                      setOpen(false);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ n, onClick }: { n: AppNotification; onClick: () => void }) {
  const Icon = ICONS[n.type] ?? Bell;
  const body = (
    <div className={`flex gap-3 px-4 py-3 hover:bg-surface-alt/60 transition-colors cursor-pointer ${
      n.read ? '' : 'bg-accent/5'
    }`}>
      <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm leading-tight ${n.read ? 'text-foreground' : 'font-semibold text-foreground'}`}>
            {n.title}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
            {timeAgo(n.created_at)}
          </span>
        </div>
        {n.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
        )}
      </div>
      {!n.read && (
        <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" aria-hidden />
      )}
    </div>
  );

  if (n.link) {
    return (
      <li>
        <Link href={n.link} onClick={onClick} className="block">{body}</Link>
      </li>
    );
  }
  return <li onClick={onClick}>{body}</li>;
}
