'use client';

import { useEffect } from 'react';

const EHB_URL = process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000';

/**
 * GoSellr register page — redirects to EHB Main identity platform.
 *
 * EHB handles all registration. After registration, EHB redirects
 * the user back to GoSellr's /callback page with an ehb_token.
 */
export default function RegisterPage() {
  useEffect(() => {
    window.location.href = `${EHB_URL}/register?redirect=gosellr`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-sm text-muted-foreground animate-pulse">
        Redirecting to EHB registration…
      </p>
    </div>
  );
}
