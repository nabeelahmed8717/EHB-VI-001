'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation, useLazyGetMeQuery } from '@/lib/store/api/auth.api';
import { useRegisterSellerMutation, useGetSellerProfileQuery } from '@/lib/store/api/seller.api';
import { setCredentials, setUser, selectCurrentUser } from '@/lib/store/auth.slice';
import { OtpStep } from '@/components/auth/OtpStep';
import type { UserPublic } from '@/lib/store/auth.slice';
import type { RootState } from '@/lib/store';
import Link from 'next/link';

const BUSINESS_TYPES = ['Retail', 'Wholesale', 'Manufacturing', 'Service', 'Other'];
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Food', 'Health', 'Other'];
type Step = 'account' | 'otp' | 'business';

export default function SellerRegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isHydrated } = useSelector((s: RootState) => s.auth);
  const currentUser = useSelector(selectCurrentUser);

  const { data: existingProfile, isLoading: profileLoading } = useGetSellerProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  const [step, setStep] = useState<Step>('account');
  const [error, setError] = useState('');

  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [registerSeller, { isLoading: isCreatingSeller }] = useRegisterSellerMutation();
  const [refetchMe] = useLazyGetMeQuery();

  // Any logged-in user can register as seller — skip account + OTP steps
  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthenticated && currentUser) {
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.full_name) setFullName(currentUser.full_name);
      setStep('business');
    }
  }, [isHydrated, isAuthenticated, currentUser]);

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try {
      await register({ email, password, full_name: fullName, role: 'seller', phone: phone || undefined }).unwrap();
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } }).data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Registration failed'));
    }
  }

  function handleOtpVerified(token: string, verifiedUser?: UserPublic) {
    const user = verifiedUser ?? { email, full_name: fullName, role: 'seller', id: '', phone: null, is_email_verified: true };
    dispatch(setCredentials({ user: user as UserPublic, token }));
    setStep('business');
  }

  async function handleBusinessSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try {
      await registerSeller({ business_name: businessName, business_type: businessType, business_category: businessCategory, store_description: storeDescription }).unwrap();
      // Backend auto-promotes user.role to 'seller' after profile creation —
      // refresh /auth/me to pick up the new role so the navbar reflects it.
      try {
        const fresh = await refetchMe().unwrap();
        if (fresh) dispatch(setUser(fresh));
      } catch { /* non-fatal — guard now allows access by profile presence */ }
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } }).data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to create store'));
    }
  }

  if (!isHydrated || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Store already set up — show store card instead of the form
  if (existingProfile?.business_name) {
    return (
      <div className="min-h-screen bg-surface-alt flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className="w-20 h-20 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-4xl">
            🏪
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">{existingProfile.business_name}</h2>
          <p className="text-sm text-muted-foreground mb-1">{existingProfile.business_category} · {existingProfile.business_type}</p>
          {existingProfile.store_description && (
            <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{existingProfile.store_description}</p>
          )}
          {!existingProfile.store_description && <div className="mb-6" />}
          <div className="bg-success-50 border border-success-100 text-success-700 text-sm rounded-xl px-4 py-2.5 mb-6">
            ✅ Your store is active
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-accent hover:bg-accent text-white font-semibold rounded-xl py-2.5 transition-colors mb-3">
            Go to Seller Dashboard →
          </button>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="w-full border border-border text-muted-foreground hover:bg-surface-alt font-medium rounded-xl py-2.5 transition-colors text-sm">
            Edit Store Settings
          </button>
        </div>
      </div>
    );
  }

  const isLoggedIn = isAuthenticated && currentUser?.role === 'seller';
  const allSteps: Step[] = ['account', 'otp', 'business'];
  const currentIdx = allSteps.indexOf(step);

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <div className="text-2xl font-extrabold text-foreground">🏪 GoSellr</div>
        <p className="text-muted-foreground text-sm mt-1">{isLoggedIn ? 'Complete your store setup' : 'Create your seller account'}</p>
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        {!isLoggedIn && (
          <div className="flex gap-2 mb-7">
            {allSteps.map((s, i) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${i < currentIdx ? 'bg-accent-500' : i === currentIdx ? 'bg-accent' : 'bg-surface-muted'}`} />
            ))}
          </div>
        )}

        {step === 'account' && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-1">Your account details</h2>
            <p className="text-sm text-muted-foreground mb-5">This email will be your seller account.</p>
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full name</label>
                <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Sara Ahmed"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email <span className="text-muted-foreground font-normal text-xs">(same email used for your store)</span>
                </label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={!!currentUser?.email}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-surface-alt disabled:text-muted-foreground disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone <span className="text-muted-foreground">(optional)</span></label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full border rounded-xl px-3.5 py-2.5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute inset-y-0 right-3 text-sm text-muted-foreground hover:text-muted-foreground">
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-3.5 py-2.5">{error}</div>}
              <button type="submit" disabled={isRegistering}
                className="w-full bg-accent hover:bg-accent disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 transition-colors">
                {isRegistering ? 'Creating account…' : 'Continue →'}
              </button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account? <Link href="/login" className="text-accent font-semibold hover:underline">Log in</Link>
              </p>
              <p className="text-sm text-center text-muted-foreground">
                <Link href="/register" className="hover:underline">← Back to role selection</Link>
              </p>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-2">Verify your email</h2>
            <p className="text-sm text-muted-foreground mb-1">We sent a 6-digit code to:</p>
            <p className="font-semibold text-foreground mb-5">{email}</p>
            <OtpStep email={email} onVerified={handleOtpVerified} />
          </>
        )}

        {step === 'business' && (
          <>
            <div className="flex items-center gap-3 mb-6 p-3 bg-accent-50 rounded-xl border border-accent-100">
              <div className="w-9 h-9 bg-accent-200 rounded-full flex items-center justify-center font-bold text-accent-700 text-sm shrink-0">
                {(currentUser?.full_name ?? fullName).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">{currentUser?.full_name ?? fullName}</div>
                <div className="text-xs text-muted-foreground truncate">{currentUser?.email ?? email}</div>
              </div>
              <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full font-medium shrink-0">seller</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Set up your store</h2>
            <p className="text-sm text-muted-foreground mb-5">Shown on your public seller profile.</p>
            <form onSubmit={handleBusinessSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Store / Business name <span className="text-destructive">*</span></label>
                <input required value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Sara's Online Store"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Type <span className="text-destructive">*</span></label>
                  <select required value={businessType} onChange={e => setBusinessType(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Select…</option>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category <span className="text-destructive">*</span></label>
                  <select required value={businessCategory} onChange={e => setBusinessCategory(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Store description</label>
                <textarea rows={3} value={storeDescription} onChange={e => setStoreDescription(e.target.value)}
                  placeholder="Tell buyers what you sell and why they should trust you…"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-3.5 py-2.5">{error}</div>}
              <button type="submit" disabled={isCreatingSeller}
                className="w-full bg-accent hover:bg-accent disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 transition-colors">
                {isCreatingSeller ? 'Creating store…' : '\U0001f3ea Launch my store'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
