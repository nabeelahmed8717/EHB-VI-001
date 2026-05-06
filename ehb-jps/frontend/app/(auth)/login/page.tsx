'use client';

import { Briefcase, Shield } from 'lucide-react';

const EHB_URL = process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000';

/**
 * JPS Login page.
 *
 * JPS is EHB-SSO only — there is no local email/password.
 * The only login path is through EHB identity platform.
 */
export default function LoginPage() {
  const handleEhbLogin = () => {
    window.location.href = `${EHB_URL}/login?redirect=jps`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Sign in to JPS</h1>
            <p className="text-sm text-gray-500 mt-1">
              Job Providing Service — powered by EHB
            </p>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-4">
          {/* Single sign-in method: EHB SSO */}
          <button
            type="button"
            onClick={handleEhbLogin}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 active:bg-teal-800 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Login with EHB
          </button>

          <p className="text-center text-xs text-gray-400">
            JPS uses your EHB account for authentication.
            <br />
            You&apos;ll be redirected to EHB to sign in.
          </p>

          {/* Register link */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an EHB account?{' '}
              <a
                href={`${EHB_URL}/register?redirect=jps`}
                className="font-medium text-teal-600 hover:underline"
              >
                Register on EHB
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
