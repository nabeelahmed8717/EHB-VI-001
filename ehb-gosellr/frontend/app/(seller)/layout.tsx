'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ShoppingBag, Star, Settings, Store, Loader2, ShieldCheck,
} from 'lucide-react';
import { useGetSellerProfileQuery } from '@/lib/store/api/seller.api';
import { RoleSwitchModal } from '@/components/role-switch-modal';
import { DashboardTopbar } from '@/components/layout/DashboardTopbar';
import { useOrdersSocket } from '@/lib/hooks/useOrdersSocket';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/jps-profile', label: 'JPS Profile', icon: ShieldCheck },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/sq-status', label: 'Trust Score', icon: Star },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

/**
 * Seller layout guard.
 *
 * Access is allowed when EITHER:
 *   1. User.role === 'seller' (legacy single-role accounts), OR
 *   2. A seller profile exists for this user (multi-role accounts where
 *      a buyer added a seller profile via /seller/register).
 *
 * This avoids the "registered store but kicked out of dashboard" bug
 * where the User document still has role='buyer' even though they own
 * an active GoSellr store.
 */
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, user } = useSelector((s: RootState) => s.auth);
  // Subscribe to live order + delivery-request + notification updates.
  useOrdersSocket();

  // Skip the seller-profile lookup if not even authenticated yet.
  const {
    data: profile,
    isLoading: profileLoading,
    isFetching: profileFetching,
  } = useGetSellerProfileQuery(undefined, {
    skip: !isHydrated || !isAuthenticated,
  });

  const hasSellerProfile = !!profile;
  const allowed = user?.role === 'seller' || hasSellerProfile;

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    // Wait for the profile lookup to settle before deciding
    if (profileLoading || profileFetching) return;
    if (!allowed) {
      // Not a seller and no profile — invite them to register a store first
      router.push('/seller/register');
    }
  }, [
    isHydrated, isAuthenticated, allowed,
    profileLoading, profileFetching, router,
  ]);

  if (!isHydrated || !isAuthenticated) return null;

  // Loading skeleton while we figure out whether a profile exists
  if (profileLoading || profileFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading your store…</span>
      </div>
    );
  }

  // If allowed check failed, the effect will redirect — render nothing here
  if (!allowed) return null;

  // User has a seller profile but their active role is still 'buyer'.
  // Show the role-switch modal so they can flip to Seller mode.
  if (user?.role !== 'seller') {
    return (
      <RoleSwitchModal
        targetRole="seller"
        onDismiss={() => router.back()}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-alt">
      {/* ── Sidebar (brand + nav only) ───────────────────────────────────── */}
      <aside className="w-60 bg-card border-r border-border flex flex-col">
        <Link
          href="/"
          className="p-5 border-b border-border flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Store className="w-5 h-5 text-accent" />
          <span className="font-bold text-foreground">Seller Hub</span>
        </Link>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
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
        <DashboardTopbar subtitle={profile?.business_name ?? null} />
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
