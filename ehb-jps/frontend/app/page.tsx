'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';

/**
 * Root page — redirect based on auth state.
 * Authenticated  → /dashboard
 * Unauthenticated → /login
 */
export default function RootPage() {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.access_token);

  useEffect(() => {
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [token, router]);

  return null;
}
