'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { NavigationLoader } from '@/components/layout/navigation-loader';
import { useAppSelector } from '@/lib/store/hooks';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.access_token);
  // `mounted` starts false so the first render (server + client) is identical.
  // After hydration completes we flip it true and run the auth check.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth redirect — only after the client has mounted and Redux is rehydrated.
  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      const ehbUrl = process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000';
      router.replace(`${ehbUrl}/login?redirect=jps`);
    }
  }, [mounted, token, router]);

  // Before mount: render the layout shell so server HTML and first client paint match.
  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50/80">
        <div className="w-[230px] shrink-0 border-r border-gray-100 bg-white" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="h-16 border-b border-gray-100 bg-white" />
          <main className="relative flex-1 overflow-y-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  // After mount, if still no token, render nothing (redirect is in-flight).
  if (!token) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/80">
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
