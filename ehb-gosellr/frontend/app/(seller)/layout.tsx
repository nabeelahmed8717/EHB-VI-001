'use client';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { RootState } from '@/lib/store';
import { Navbar } from '@/components/layout/navbar';
import { SellerSidebar } from '@/components/layout/seller-sidebar';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated, user } = useSelector((s: RootState) => s.auth);
  const router = useRouter();

  useEffect(() => {
    // Wait for AuthHydrator to populate the store from localStorage.
    // Without this guard, the first render always sees isAuthenticated=false
    // and incorrectly redirects the user to /login.
    if (!isHydrated) return;

    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'seller') { router.push('/browse'); }
  }, [isAuthenticated, isHydrated, user, router]);

  // Render nothing until we know the real auth state
  if (!isHydrated) return null;
  if (!isAuthenticated || user?.role !== 'seller') return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <SellerSidebar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
