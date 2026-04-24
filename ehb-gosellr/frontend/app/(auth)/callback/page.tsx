'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/lib/store/auth.slice';
import { useEhbCallbackMutation } from '@/lib/store/api/auth.api';
import { Loader2, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * GoSellr EHB callback page.
 *
 * The EHB identity platform redirects here after successful
 * register/login: /callback?ehb_token=<token>
 *
 * Flow:
 * 1. Read ?ehb_token from URL
 * 2. Call GoSellr backend POST /auth/ehb-callback
 * 3. Receive GoSellr JWT + user
 * 4. Save to Redux store
 * 5. Redirect to dashboard (seller) or browse (buyer)
 */
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [ehbCallback] = useEhbCallbackMutation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ehbToken = searchParams.get('ehb_token');

    if (!ehbToken) {
      setError('No authentication token received. Please try again.');
      return;
    }

    ehbCallback({ ehb_token: ehbToken })
      .unwrap()
      .then((res) => {
        dispatch(setCredentials({ user: res.user, token: res.access_token }));
        // Route based on role
        const dest = res.user.role === 'seller' ? '/dashboard' : '/browse';
        router.replace(dest);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { data?: { message?: string } })?.data?.message ??
          'Authentication failed. Please try again.';
        setError(msg);
      });
  // ehbCallback and dispatch are stable — intentionally omit to run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">GoSellr</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          {error ? (
            <>
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-primary hover:underline"
              >
                ← Back to login
              </button>
            </>
          ) : (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Completing sign-in…
              </p>
            </>
          )}
        </CardContent>
      </Card>
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
