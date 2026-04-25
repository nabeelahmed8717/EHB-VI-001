'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { ehbApi, verifyStoredToken, getStoredEhbToken } from '@/lib/api';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
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

function buildCallbackUrl(platformId: string, token: string): string {
  const callbackBase =
    process.env[`NEXT_PUBLIC_CALLBACK_${platformId.toUpperCase()}`] ??
    `http://localhost:3001/callback`;
  return `${callbackBase}?ehb_token=${encodeURIComponent(token)}`;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPlatform = searchParams.get('redirect') ?? undefined;
  const platformLabel = redirectPlatform ? (platformLabels[redirectPlatform] ?? redirectPlatform) : null;

  const [checkingSession, setCheckingSession] = useState(!!redirectPlatform);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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
    verifyStoredToken().then((user) => {
      if (user) {
        window.location.href = buildCallbackUrl(redirectPlatform, storedToken);
      } else {
        setCheckingSession(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await ehbApi.register(data, redirectPlatform);
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        router.push('/login?registered=1');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError('root', { message });
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-green-500" />
          Checking session…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── LEFT: Form Panel ── */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 sm:px-16 xl:px-24 py-12">
        <div className="max-w-sm w-full mx-auto space-y-6">
          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Create account!
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your account works across all EHB platforms —{' '}
              <span className="font-semibold text-gray-700">GoSellr, OLS, HPS</span>, and more.
              Get started for free.
            </p>
          </div>

          {/* Redirected banner */}
          {platformLabel && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
              Redirected from <span className="font-semibold">{platformLabel}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <input
                id="full_name"
                placeholder="Full Name"
                {...register('full_name')}
                className="w-full rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
              />
              {errors.full_name && (
                <p className="mt-1 ml-2 text-xs text-red-500">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                id="email"
                type="email"
                placeholder="Email address"
                {...register('email')}
                className="w-full rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
              />
              {errors.email && (
                <p className="mt-1 ml-2 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min. 6 characters)"
                  {...register('password')}
                  className="w-full rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 ml-2 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div>
              <input
                id="phone"
                type="tel"
                placeholder="Phone (optional)"
                {...register('phone')}
                className="w-full rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
              />
            </div>

            {/* Root error */}
            {errors.root && (
              <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
                {errors.root.message}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-gray-900 text-white py-3.5 text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social buttons */}
          <div className="flex items-center justify-center gap-4">
            {/* Google */}
            <button
              type="button"
              className="h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-700 transition"
              aria-label="Continue with Google"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>

            {/* Apple */}
            <button
              type="button"
              className="h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-700 transition"
              aria-label="Continue with Apple"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </button>

            {/* Facebook */}
            <button
              type="button"
              className="h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-700 transition"
              aria-label="Continue with Facebook"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              href={redirectPlatform ? `/login?redirect=${redirectPlatform}` : '/login'}
              className="font-semibold text-green-600 hover:text-green-700 transition"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT: Placeholder Panel ── */}
      <div className="hidden lg:flex items-center justify-center w-1/2 bg-[#edf7ed] rounded-3xl m-4">
        <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="h-24 w-24 rounded-2xl bg-green-100 border-2 border-dashed border-green-300 flex items-center justify-center">
            <svg className="h-10 w-10 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-green-400 font-medium">Image placeholder</p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
