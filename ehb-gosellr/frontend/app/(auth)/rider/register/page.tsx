'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation, useLazyGetMeQuery } from '@/lib/store/api/auth.api';
import { useRegisterRiderMutation } from '@/lib/store/api/rider.api';
import { setCredentials, setUser, selectCurrentUser } from '@/lib/store/auth.slice';
import { OtpStep } from '@/components/auth/OtpStep';
import type { UserPublic } from '@/lib/store/auth.slice';
import type { RootState } from '@/lib/store';
import Link from 'next/link';

type Step = 'account' | 'otp' | 'vehicle';
const VEHICLE_TYPES = ['bike', 'motorcycle', 'car', 'van', 'truck'] as const;
const allSteps: Step[] = ['account', 'otp', 'vehicle'];

export default function RiderRegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isHydrated } = useSelector((s: RootState) => s.auth);
  const currentUser = useSelector(selectCurrentUser);

  const [step, setStep] = useState<Step>('account');
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [cnic, setCnic] = useState('');
  const [vehicleType, setVehicleType] = useState<typeof VEHICLE_TYPES[number]>('motorcycle');
  const [licensePlate, setLicensePlate] = useState('');
  const [zone, setZone] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<UserPublic | null>(null);

  // Any logged-in user can register as rider — skip account + OTP steps
  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthenticated && currentUser) {
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.full_name) setFullName(currentUser.full_name);
      setStep('vehicle');
    }
  }, [isHydrated, isAuthenticated, currentUser]);

  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [registerRider, { isLoading: isCreatingRider }] = useRegisterRiderMutation();
  const [refetchMe] = useLazyGetMeQuery();

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try {
      await register({ email, password, full_name: fullName, role: 'rider', phone: phone || undefined }).unwrap();
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } }).data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Registration failed'));
    }
  }

  function handleOtpVerified(token: string, user: UserPublic) {
    dispatch(setCredentials({ user, token }));
    setVerifiedUser(user);
    setStep('vehicle');
  }

  async function handleVehicleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try {
      await registerRider({ cnic, vehicle_type: vehicleType, license_plate: licensePlate, availability_zone: zone }).unwrap();
      // Backend auto-promotes user.role to 'rider' — refresh /auth/me so the
      // navbar reflects the new role without forcing a re-login.
      try {
        const fresh = await refetchMe().unwrap();
        if (fresh) dispatch(setUser(fresh));
      } catch { /* non-fatal — guard now allows access by profile presence */ }
      router.push('/dashboard/rider');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } }).data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to create rider profile'));
    }
  }

  const stepIdx = allSteps.indexOf(step);

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <div className="text-2xl font-extrabold text-foreground">🏍️ GoSellr</div>
        <p className="text-muted-foreground text-sm mt-1">Join as a delivery rider</p>
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        <div className="flex gap-2 mb-7">
          {allSteps.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${i < stepIdx ? 'bg-warning-400' : i === stepIdx ? 'bg-orange-500' : 'bg-surface-muted'}`} />
          ))}
        </div>

        {step === 'account' && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-1">Your account details</h2>
            <p className="text-sm text-muted-foreground mb-5">This email will be your rider account.</p>
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full name</label>
                <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Bilal Raza"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email <span className="text-muted-foreground font-normal text-xs">(same email used for your rider account)</span>
                </label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={!!currentUser?.email}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-surface-alt disabled:text-muted-foreground disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone <span className="text-muted-foreground">(optional)</span></label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full border rounded-xl px-3.5 py-2.5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute inset-y-0 right-3 text-sm text-muted-foreground hover:text-muted-foreground">
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-3.5 py-2.5">{error}</div>}
              <button type="submit" disabled={isRegistering}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 transition-colors">
                {isRegistering ? 'Creating account…' : 'Continue →'}
              </button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account? <Link href="/login" className="text-warning-500 font-semibold hover:underline">Log in</Link>
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

        {step === 'vehicle' && (
          <>
            <div className="flex items-center gap-3 mb-6 p-3 bg-warning-50 rounded-xl border border-orange-100">
              <div className="w-9 h-9 bg-orange-200 rounded-full flex items-center justify-center font-bold text-warning-500 text-sm shrink-0">
                {(currentUser?.full_name ?? verifiedUser?.full_name ?? fullName).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">{currentUser?.full_name ?? verifiedUser?.full_name ?? fullName}</div>
                <div className="text-xs text-muted-foreground truncate">{currentUser?.email ?? verifiedUser?.email ?? email}</div>
              </div>
              <span className="text-xs bg-warning-100 text-warning-500 px-2 py-0.5 rounded-full font-medium shrink-0">rider</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Vehicle details</h2>
            <p className="text-sm text-muted-foreground mb-5">Needed for delivery assignment and verification.</p>
            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">CNIC number <span className="text-destructive">*</span></label>
                <input required value={cnic} onChange={e => setCnic(e.target.value)} placeholder="35202-1234567-1"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Vehicle type <span className="text-destructive">*</span></label>
                  <select required value={vehicleType} onChange={e => setVehicleType(e.target.value as typeof VEHICLE_TYPES[number])}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">License plate <span className="text-destructive">*</span></label>
                  <input required value={licensePlate} onChange={e => setLicensePlate(e.target.value)} placeholder="ABC-123"
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Service area <span className="text-destructive">*</span></label>
                <input required value={zone} onChange={e => setZone(e.target.value)} placeholder="e.g. Lahore Central"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-3.5 py-2.5">{error}</div>}
              <button type="submit" disabled={isCreatingRider}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 transition-colors">
                {isCreatingRider ? 'Saving details…' : '\U0001f6cd️ Start delivering'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

              <button type="submit" disabled={isCreatingRider}
                className="w-full bg-warning-400 hover:bg-warning-500 text-warning-foreground rounded-pill py-3 font-semibold text-sm transition-colors disabled:opacity-50">
                {isCreatingRider ? 'Creating profile…' : 'Become a Rider'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
