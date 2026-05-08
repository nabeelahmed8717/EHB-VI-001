'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '@/lib/store/api/auth.api';
import { setCredentials } from '@/lib/store/auth.slice';
import { OtpStep } from '@/components/auth/OtpStep';
import Link from 'next/link';
import type { UserPublic } from '@/lib/store/auth.slice';

type Step = 'account' | 'otp';

export default function BuyerRegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [step, setStep] = useState<Step>('account');
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [user, setUser] = useState<UserPublic | null>(null);

  const [register, { isLoading }] = useRegisterMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await register({
        email, password, full_name: fullName, role: 'buyer', phone: phone || undefined,
      }).unwrap();
      setUser(res.user);
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string | string[] } }).data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Registration failed'));
    }
  }

  function handleOtpVerified(token: string, user: UserPublic) {
    dispatch(setCredentials({ user, token }));
    router.push('/browse');
  }

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <div className="text-2xl font-extrabold text-foreground">🛒 GoSellr</div>
        <p className="text-muted-foreground text-sm mt-1">Create your buyer account</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        {/* Steps */}
        <div className="flex gap-2 mb-7">
          {(['account', 'otp'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                step === s ? 'bg-success-500' :
                i < (['account', 'otp'] as Step[]).indexOf(step) ? 'bg-success-500' : 'bg-surface-muted'
              }`}
            />
          ))}
        </div>

        {step === 'account' && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-5">Your details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full name</label>
                <input
                  required
                  placeholder="Ali Khan"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  placeholder="+92 300 0000000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute inset-y-0 right-3 text-muted-foreground hover:text-muted-foreground text-sm"
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-3.5 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-success-500 hover:bg-success-600 disabled:opacity-50 text-white font-semibold
                  rounded-xl py-2.5 transition-colors"
              >
                {isLoading ? 'Creating account…' : 'Continue →'}
              </button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-2">Verify your email</h2>
            <p className="text-sm text-muted-foreground mb-5">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <OtpStep email={email} onVerified={handleOtpVerified} />
          </>
        )}

        <p className="text-sm text-center text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-success-600 font-semibold hover:underline">Sign in</Link>
        </p>
        <p className="text-sm text-center text-muted-foreground mt-1">
          <Link href="/register" className="hover:underline">← Back to role selection</Link>
        </p>
      </div>
    </div>
  );
}
