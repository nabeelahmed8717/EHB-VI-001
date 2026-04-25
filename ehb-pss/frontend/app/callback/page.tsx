'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Shield, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

type Status = 'verifying' | 'success' | 'error';

export default function CallbackPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [status,  setStatus]  = useState<Status>('verifying');
  const [message, setMessage] = useState('Verifying your EHB session…');

  useEffect(() => {
    const ehbToken = searchParams.get('ehb_token');

    if (!ehbToken) {
      setStatus('error');
      setMessage('No token found in the callback URL. Please try signing in again.');
      return;
    }

    (async () => {
      const result = await signIn('ehb-sso', {
        token: ehbToken,
        redirect: false,
      });

      if (result?.error || !result?.ok) {
        setStatus('error');
        setMessage(
          'Your EHB session token is invalid or has expired. Please sign in again from the EHB platform.',
        );
        return;
      }

      setStatus('success');
      setMessage('Authenticated! Redirecting to dashboard…');

      // Short pause so the user sees the success state before redirect
      setTimeout(() => router.replace('/overview'), 1200);
    })();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        {/* Brand mark */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white mb-6 shadow-lg">
          <Shield className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">PSS Admin</h1>
        <p className="text-sm text-gray-400 mb-8">EHB Platform Support Services</p>

        {/* Status card */}
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow-sm">
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4">
              {/* Circular spinner */}
              <span className="relative flex h-12 w-12 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" />
                </svg>
                <svg
                  className="absolute inset-0 h-full w-full animate-spin"
                  viewBox="0 0 48 48"
                  fill="none"
                  style={{ animationDuration: '700ms' }}
                >
                  <circle
                    cx="24" cy="24" r="20"
                    stroke="#2563EB" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="30 96"
                  />
                </svg>
              </span>
              <p className="text-sm font-medium text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-600">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">{message}</p>
              <a
                href="/login"
                className="mt-1 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Back to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
