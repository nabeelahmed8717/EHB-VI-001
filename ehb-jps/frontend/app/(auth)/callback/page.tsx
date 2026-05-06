'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/lib/store/hooks';
import { setCredentials } from '@/lib/store/auth.slice';
import { useEhbCallbackMutation } from '@/lib/store/api/auth.api';
import { Loader2, Briefcase } from 'lucide-react';

/**
 * JPS EHB SSO callback page — same pattern as GoSellr.
 *
 * EHB redirects here after login: /callback?ehb_token=<token>
 *
 * Flow:
 *  1. Read ?ehb_token from URL
 *  2. POST /auth/callback to JPS backend → receive JPS JWT + user
 *  3. Save to Redux (persisted in sessionStorage)
 *  4. Redirect to /dashboard
 */
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [ehbCallback] = useEhbCallbackMutation();
  const [error, setError] = useState<string | null>(null);

  const EHB_URL = process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000';

  useEffect(() => {
    const ehbToken = searchParams.get('ehb_token');

    if (!ehbToken) {
      setError('No authentication token received. Please try again.');
      return;
    }

    ehbCallback({ ehb_token: ehbToken })
      .unwrap()
      .then((res) => {
        dispatch(setCredentials({ user: res.user, access_token: res.access_token }));
        router.replace('/dashboard');
      })
      .catch((err: unknown) => {
        const msg =
          (err as { data?: { message?: string } })?.data?.message ??
          'Authentication failed. Please try again.';
        setError(typeof msg === 'string' ? msg : 'Authentication failed. Please try again.');
      });
  // ehbCallback and dispatch are stable — run once only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-sm p-8 text-center space-y-4">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">JPS — Job Providing Service</h1>

        {error ? (
          <div className="space-y-3 pt-2">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <a
              href={`${EHB_URL}/login?redirect=jps`}
              className="inline-block text-sm text-teal-600 hover:underline"
            >
              ← Back to login
            </a>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600 mx-auto" />
            <p className="text-sm text-gray-500">Completing sign-in…</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
