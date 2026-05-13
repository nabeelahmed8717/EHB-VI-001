'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bell, Loader2 } from 'lucide-react';

/**
 * Legacy "Available orders" self-pick page.
 *
 * Riders no longer browse a shared pool of orders — sellers now send
 * delivery requests directly. The route is kept for backwards
 * compatibility but auto-redirects to the new Requests inbox.
 */
export default function LegacyAvailablePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/rider/requests');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-muted-foreground gap-2">
      <Bell className="w-8 h-8 opacity-40" />
      <p className="text-sm flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to your requests…
      </p>
    </div>
  );
}
