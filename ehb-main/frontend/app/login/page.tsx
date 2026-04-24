'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { EhbLogo } from '@/components/ehb-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ehbApi, verifyStoredToken, getStoredEhbToken } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

const platformLabels: Record<string, string> = {
  gosellr: 'GoSellr',
  ols: 'OLS — Legal Marketplace',
  hps: 'HPS — Healthcare',
  jps: 'JPS — Workforce',
  wms: 'WMS — Hospital Management',
  obs: 'OBS — Book Retail',
};

/**
 * Build the callback redirect URL for a platform using the stored ehb_token.
 * Matches how the backend builds it (PLATFORM_CALLBACK_URLS env var on backend).
 * The frontend just redirects to the platform's callback page with the token.
 */
function buildCallbackUrl(platformId: string, token: string): string {
  const callbackBase =
    process.env[`NEXT_PUBLIC_CALLBACK_${platformId.toUpperCase()}`] ??
    `http://localhost:3001/callback`; // fallback for gosellr dev
  return `${callbackBase}?ehb_token=${encodeURIComponent(token)}`;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPlatform = searchParams.get('redirect') ?? undefined;
  const justRegistered = searchParams.get('registered') === '1';
  const platformLabel = redirectPlatform
    ? (platformLabels[redirectPlatform] ?? redirectPlatform)
    : null;

  // "already logged in" check state
  const [checkingSession, setCheckingSession] = useState(!!redirectPlatform);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  /**
   * On mount: if a redirectPlatform is provided, check whether the user
   * already has a valid (non-expired, non-revoked) EHB token in localStorage.
   * If yes → skip the form and redirect straight to the platform callback.
   */
  useEffect(() => {
    if (!redirectPlatform) {
      setCheckingSession(false);
      return;
    }

    const storedToken = getStoredEhbToken();
    if (!storedToken) {
      setCheckingSession(false);
      return;
    }

    // Verify the token is still valid (not expired, not revoked)
    verifyStoredToken().then((user) => {
      if (user) {
        // Token is valid — skip login form, send directly to platform
        window.location.href = buildCallbackUrl(redirectPlatform, storedToken);
      } else {
        // Token invalid/expired — show the login form normally
        setCheckingSession(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await ehbApi.login(data, redirectPlatform);

      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError('root', { message });
    }
  };

  // While checking the stored session, show a loading state
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="text-center space-y-4">
          <EhbLogo size="lg" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking session…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <EhbLogo size="lg" />
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Sign in to your EHB account — your identity across all platforms.
            </CardDescription>
          </CardHeader>

          {justRegistered && (
            <div className="mx-6 mb-2 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
              Account created! Please sign in.
            </div>
          )}

          {platformLabel && (
            <div className="mx-6 mb-2 rounded-md bg-indigo-50 border border-indigo-200 px-4 py-2 text-sm text-indigo-700">
              Redirected from{' '}
              <span className="font-semibold">{platformLabel}</span>
            </div>
          )}

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {errors.root && (
                <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {errors.root.message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href={redirectPlatform ? `/register?redirect=${redirectPlatform}` : '/register'}
                className="text-primary hover:underline font-medium"
              >
                Register
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          EHB — Education Health Business &middot; Unified Identity Platform
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
