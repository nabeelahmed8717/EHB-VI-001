'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EhbLogo } from '@/components/ehb-logo';
import { Loader2 } from 'lucide-react';

/**
 * EHB internal callback page.
 *
 * This is NOT the platform callback — platforms have their own callback pages.
 * This page handles the edge case where a user lands on EHB /callback without
 * a platform context (e.g. direct navigation). It simply shows a status message.
 *
 * The real platform callback flow is:
 *   EHB register/login → redirects to PLATFORM /callback?ehb_token=xxx
 *   Platform frontend callback → calls platform backend /auth/ehb-callback
 */
function CallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('Processing…');

  useEffect(() => {
    const ehbToken = searchParams.get('ehb_token');

    if (!ehbToken) {
      setStatus('error');
      setMessage('No token found. Please try signing in again.');
      return;
    }

    // This page is only reached if someone navigated here directly.
    // Normally users would land on their platform's callback page.
    setStatus('error');
    setMessage(
      'This callback URL is for sub-platforms, not direct EHB access. ' +
      'Please return to your platform and try again.',
    );
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <EhbLogo size="lg" />

        <div className="rounded-xl border bg-white shadow-sm p-8 space-y-4">
          {status === 'loading' ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-red-600">{message}</p>
              <a
                href="/login"
                className="inline-block text-sm text-primary hover:underline"
              >
                ← Back to login
              </a>
            </>
          )}
        </div>
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
