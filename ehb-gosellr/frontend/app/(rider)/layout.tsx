'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import Link from 'next/link';
import { LayoutDashboard, Bell, Clock, DollarSign, Truck, Loader2, ShieldCheck } from 'lucide-react';
import { useGetRiderProfileQuery } from '@/lib/store/api/rider.api';
import { useGetMyOrdersQuery } from '@/lib/store/api/orders.api';
import { useGetPendingDeliveryRequestsQuery } from '@/lib/store/api/delivery-requests.api';
import { RiderRequestToastListener } from '@/components/rider/RiderRequestToastListener';
import { DashboardTopbar } from '@/components/layout/DashboardTopbar';

type NavBadgeTone = 'accent' | 'warning' | 'destructive';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: 'requests' | 'active';
  badgeTone?: NavBadgeTone;
}

const NAV: NavItem[] = [
  { href: '/dashboard/rider', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/rider/requests', label: 'Requests', icon: Bell, badgeKey: 'requests', badgeTone: 'destructive' },
  { href: '/dashboard/rider/active', label: 'Active', icon: Clock, badgeKey: 'active', badgeTone: 'accent' },
  { href: '/dashboard/rider/history', label: 'History', icon: DollarSign },
  { href: '/dashboard/rider/jps-profile', label: 'JPS Profile', icon: ShieldCheck },
];

const BADGE_TONE: Record<NavBadgeTone, string> = {
  accent: 'bg-accent text-accent-foreground',
  warning: 'bg-warning-500 text-white',
  destructive: 'bg-destructive text-destructive-foreground',
};

/**
 * Rider layout guard. Mirrors the seller layout — access allowed when
 * User.role === 'rider' OR a rider profile exists for this user.
 */
export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, user } = useSelector((s: RootState) => s.auth);

  const {
    data: profile,
    isLoading: profileLoading,
    isFetching: profileFetching,
  } = useGetRiderProfileQuery(undefined, {
    skip: !isHydrated || !isAuthenticated,
  });

  // Live badge counts. RTK Query shares the cache with the Requests + Active
  // pages, so this is essentially free after the first load. WS pushes
  // invalidate the tags so badges refresh automatically.
  const skipFetches = !isHydrated || !isAuthenticated || user?.role !== 'rider';
  const { data: pendingRequests = [] } = useGetPendingDeliveryRequestsQuery(undefined, {
    skip: skipFetches,
  });
  const { data: orders = [] } = useGetMyOrdersQuery(undefined, { skip: skipFetches });
  const counts: Record<string, number> = {
    requests: pendingRequests.length,
    // "Active" = order assigned to me and not yet delivered/cancelled.
    active: orders.filter(
      (o) =>
        o.rider_id != null &&
        (o.status === 'ready_for_delivery'
          || o.status === 'picked'
          || o.status === 'out_for_delivery'),
    ).length,
  };

  const hasRiderProfile = !!profile;
  const allowed = user?.role === 'rider' || hasRiderProfile;

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (profileLoading || profileFetching) return;
    if (!allowed) {
      router.push('/rider/register');
    }
  }, [
    isHydrated, isAuthenticated, allowed,
    profileLoading, profileFetching, router,
  ]);

  if (!isHydrated || !isAuthenticated) return null;

  if (profileLoading || profileFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading rider hub…</span>
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="flex min-h-screen bg-surface-alt">
      {/* Globally listens for delivery_request:new events and pops a toast */}
      <RiderRequestToastListener />

      {/* ── Sidebar (brand + nav only) ───────────────────────────────────── */}
      <aside className="w-60 bg-card border-r border-border flex flex-col">
        <Link
          href="/"
          className="p-5 border-b border-border flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Truck className="w-5 h-5 text-accent" />
          <span className="font-bold text-foreground">Rider Hub</span>
        </Link>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, badgeKey, badgeTone = 'accent' }) => {
            const active = pathname === href;
            const count = badgeKey ? counts[badgeKey] ?? 0 : 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted-foreground hover:bg-surface-alt hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span
                    className={`min-w-[20px] h-5 px-1.5 rounded-pill text-[10px] font-bold flex items-center justify-center ${BADGE_TONE[badgeTone]}`}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Right column: topbar + page content ──────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <DashboardTopbar
          subtitle={
            profile?.availability === 'online' ? 'Online · available for deliveries'
            : profile?.availability === 'on_delivery' ? 'On a delivery'
            : profile ? 'Offline'
            : null
          }
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
