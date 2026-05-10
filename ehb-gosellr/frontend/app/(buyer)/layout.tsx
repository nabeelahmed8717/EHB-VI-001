'use client';

import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { RootState } from '@/lib/store';
import { Navbar } from '@/components/layout/navbar';
import { RoleSwitchModal } from '@/components/role-switch-modal';

/**
 * Marketplace layout.
 *
 * Public (no login required):
 *   - /browse           — product list
 *   - /browse/[id]      — product detail
 * Anyone (logged in or not) can browse and view products. They only need to
 * authenticate when they take a personalised action.
 *
 * Gated (login required):
 *   - /cart, /checkout, /orders, /orders/[id], /settings
 * Unauthenticated → save intended URL → redirect to /login. After signing in,
 * the login page brings them back here.
 *
 * Role:
 *   - Authenticated and is a buyer → render normally.
 *   - Authenticated but role !== 'buyer' → render the page behind a
 *     RoleSwitchModal so they can switch to Buyer mode without losing their
 *     place. The modal applies to gated pages only — public browse pages are
 *     visible to anyone, including users in seller/rider mode.
 */
const PUBLIC_BUYER_PREFIXES = ['/browse'] as const;

function isPublicBuyerPath(pathname: string): boolean {
  return PUBLIC_BUYER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated, user } = useSelector((s: RootState) => s.auth);
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicBuyerPath(pathname);

  useEffect(() => {
    if (!isHydrated) return;
    if (isPublic) return; // /browse and /browse/[id] are open to everyone
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('gosellr_next', pathname);
      }
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, isPublic, router, pathname]);

  // Block render until the auth state has hydrated (avoids flicker between
  // "appear logged out, redirect" and "actually logged in").
  if (!isHydrated) return null;

  // Public browse pages render for everyone.
  if (isPublic) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-alt">
        <Navbar />
        <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 md:px-6 py-6 md:py-8">
          {children}
        </main>
      </div>
    );
  }

  // Gated pages — must be authenticated past this point.
  if (!isAuthenticated) return null;

  const isBuyer = user?.role === 'buyer';

  return (
    <div className="min-h-screen flex flex-col bg-surface-alt">
      <Navbar />
      {/* When the user is not in Buyer mode, show the switch modal overlaid
          on top of the page layout. Once they switch, this renders null and
          the children become visible without any navigation. */}
      {!isBuyer && (
        <RoleSwitchModal
          targetRole="buyer"
          onDismiss={() => router.back()}
        />
      )}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
