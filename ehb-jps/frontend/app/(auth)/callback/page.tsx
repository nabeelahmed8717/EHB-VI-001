'use client';
import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/lib/store/hooks';
import { setCredentials } from '@/lib/store/auth.slice';

/**
 * EHB SSO callback page.
 *
 * EHB redirects here with ?ehb_token=<token>
 * We exchange it with JPS backend → store JWT → redirect to dashboard.
 */
export default function CallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const ehbToken = params.get('ehb_token');
    if (!ehbToken) {
      router.replace(`${process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000'}/login?redirect=jps`);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_JPS_API_URL ?? 'http://localhost:3006'}/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ehb_token: ehbToken }),
    })
      .then((r) => r.json())
      .then((data: { access_token: string; user: { id: string; ehb_user_id: string; email: string; full_name: string } }) => {
        if (!data.access_token) throw new Error('No token');
        dispatch(setCredentials({ user: data.user, access_token: data.access_token }));
        router.replace('/dashboard');
      })
      .catch(() => {
        router.replace(`${process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000'}/login?redirect=jps&error=auth_failed`);
      });
  }, [dispatch, params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
