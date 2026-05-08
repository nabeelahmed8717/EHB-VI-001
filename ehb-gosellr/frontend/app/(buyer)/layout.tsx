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
 * - Not authenticated → save intended URL to localStorage then redirect to /login.
 *   The login page will redirect back here after a successful sign-in.
 *
 * - Authenticated but not a buyer → render the page behind a RoleSwitchModal
 *   so the user can switch to Buyer mode without losing their place.
 *   No hard redirect — the modal dismisses naturally once the role is switched.
 *
 * - Authenticated buyer → render normally.
 */
export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated, user } = useSelector((s: RootState) => s.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      // Save intended destination so login can bring the user back here
      if (typeof window !== 'undefined') {
        localStorage.setItem('gosellr_next', pathname);
      }
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, router, pathname]);

  if (!isHydrated) return null;
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
