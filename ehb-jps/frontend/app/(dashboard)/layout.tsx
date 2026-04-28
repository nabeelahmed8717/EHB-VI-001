'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { NavigationLoader } from '@/components/layout/navigation-loader';
import { useAppSelector } from '@/lib/store/hooks';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.access_token);

  // Client-side auth guard — if no token, bounce to EHB login
  useEffect(() => {
    if (!token) {
      const ehbUrl = process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000';
      router.replace(`${ehbUrl}/login?redirect=jps`);
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        {/*
          `relative` is required so NavigationLoader's `absolute inset-0`
          is scoped to this content area — not the full viewport.
        */}
        <main className="relative flex-1 overflow-y-auto">
          <NavigationLoader />
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
