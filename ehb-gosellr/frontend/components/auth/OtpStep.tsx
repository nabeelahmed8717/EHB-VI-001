'use client';

import { useState } from 'react';
import { useSendOtpMutation, useVerifyOtpMutation } from '@/lib/store/api/auth.api';
import type { UserPublic } from '@/lib/store/auth.slice';

interface OtpStepProps {
  email: string;
  onVerified: (token: string, user: UserPublic) => void;
}

export function OtpStep({ email, onVerified }: OtpStepProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  const [sendOtp, { isLoading: isSending }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();

  async function handleVerify() {
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return; }
    try {
      const res = await verifyOtp({ email, otp }).unwrap();
      // Pass both token AND the verified user object back to parent
      onVerified(res.access_token, res.user);
    } catch (e: unknown) {
      const msg = (e as { data?: { message?: string } }).data?.message;
      setError(msg ?? 'Invalid or expired OTP');
    }
  }

  async function handleResend() {
    setError('');
    setResent(false);
    await sendOtp({ email }).unwrap().catch(() => undefined);
    setResent(true);
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
        className="w-full text-center text-2xl tracking-[0.5em] border rounded-xl px-4 py-3
          focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {error && <p className="text-sm text-destructive text-center">{error}</p>}
      {resent && <p className="text-sm text-success-600 text-center">✓ Code resent to {email}</p>}

      <button
        onClick={handleVerify}
        disabled={isVerifying || otp.length !== 6}
        className="w-full bg-accent hover:bg-accent text-white rounded-xl py-2.5 font-semibold
          disabled:opacity-50 transition-colors"
      >
        {isVerifying ? 'Verifying…' : 'Verify & Continue →'}
      </button>

      <button
        onClick={handleResend}
        disabled={isSending}
        className="w-full text-sm text-muted-foreground hover:text-muted-foreground underline"
      >
        {isSending ? 'Sending…' : "Didn't receive it? Resend code"}
      </button>
    </div>
  );
}
