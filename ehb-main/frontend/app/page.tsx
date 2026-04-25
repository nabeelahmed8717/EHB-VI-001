'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyStoredToken } from '@/lib/api';
import { Loader2 } from 'lucide-react';

/**
 * Root route — check for a valid session and route accordingly.
 * ✓ Valid token  → /dashboard
 * ✗ No / invalid → /login
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    verifyStoredToken().then((user) => {
      router.replace(user ? '/dashboard' : '/login');
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#13131f]">
      <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
    </div>
  );
}
