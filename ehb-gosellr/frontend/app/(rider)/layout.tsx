'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import Link from 'next/link';
import { LayoutDashboard, Bell, Clock, DollarSign, Truck, Loader2, ShieldCheck } from 'lucide-react';
import { useGetRiderProfileQuery } from '@/lib/store/api/rider.api';
import { RiderRequestToastListener } from '@/components/rider/RiderRequestToastListener';
import { DashboardTopbar } from '@/components/layout/DashboardTopbar';

const NAV = [
  { href: '/dashboard/rider', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/rider/requests', label: 'Requests', icon: Bell },
  { href: '/dashboard/rider/active', label: 'Active', icon: Clock },
  { href: '/dashboard/rider/history', label: 'History', icon: DollarSign },
  { href: '/dashboard/rider/jps-profile', label: 'JPS Profile', icon: ShieldCheck },
];

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
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
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
                {label}
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
