'use client';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { RootState } from '@/lib/store';
import { Navbar } from '@/components/layout/navbar';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated, user } = useSelector((s: RootState) => s.auth);
  const router = useRouter();

  useEffect(() => {
    // Wait for AuthHydrator to populate the store from localStorage.
    if (!isHydrated) return;

    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'buyer') { router.push('/dashboard'); }
  }, [isAuthenticated, isHydrated, user, router]);

  // Render nothing until we know the real auth state
  if (!isHydrated) return null;
  if (!isAuthenticated || user?.role !== 'buyer') return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6">{children}</main>
    </div>
  );
}
