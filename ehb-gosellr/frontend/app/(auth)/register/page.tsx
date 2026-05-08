'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  ShieldCheck, ShoppingBag, Store, Truck, ArrowRight,
  CheckCircle2, LogIn,
} from 'lucide-react';
import type { RootState } from '@/lib/store';

const EHB_URL = process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000';

type Role = 'buyer' | 'seller' | 'rider';

/**
 * Register page is now auth-aware.
 *
 * - Anonymous users  → click a role → redirect to EHB to create an account,
 *   then EHB redirects back to GoSellr (with optional `next` deep-link).
 * - Authenticated users → already have an EHB identity, so we skip the
 *   EHB hop entirely and go straight to the in-app profile-setup pages:
 *     buyer  → /browse  (already a shopper, nothing to set up)
 *     seller → /seller/register  (set up your GoSellr store)
 *     rider  → /rider/register   (add vehicle + CNIC)
 *   If the user already has the role they're picking, we route them to
 *   their dashboard instead of asking them to register again.
 */
export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  const goToEhbRegister = (role: Role, next?: string) => {
    if (next) localStorage.setItem('gosellr_next', next);
    window.location.href = `${EHB_URL}/register?redirect=gosellr&role=${role}`;
  };

  const handleRoleClick = (role: Role) => {
    // Anonymous → standard EHB sign-up flow
    if (!isAuthenticated || !user) {
      const next =
        role === 'seller' ? '/seller/register' :
        role === 'rider'  ? '/rider/register' :
        undefined;
      goToEhbRegister(role, next);
      return;
    }

    // Authenticated → skip EHB entirely
    if (role === 'buyer') {
      // Already have an account; just go shop
      router.push('/browse');
      return;
    }

    if (role === 'seller') {
      // If already a seller, jump straight to the dashboard
      router.push(user.role === 'seller' ? '/dashboard' : '/seller/register');
      return;
    }

    if (role === 'rider') {
      router.push(user.role === 'rider' ? '/dashboard/rider' : '/rider/register');
      return;
    }
  };

  // Helpers to render role-aware sub-copy
  const isLogged = isAuthenticated && !!user;
  const userRole = user?.role;

  const buyerHint = isLogged
    ? userRole === 'buyer'
      ? "You're already signed in. Continue shopping →"
      : 'Browse verified products as a buyer.'
    : 'Browse verified products, add to cart, and get them delivered.';

  const sellerHint = isLogged
    ? userRole === 'seller'
      ? "You're already a seller. Open your dashboard →"
      : 'Skip EHB sign-up — set up your GoSellr store directly.'
    : 'Register on EHB, then set up your GoSellr store.';

  const riderHint = isLogged
    ? userRole === 'rider'
      ? "You're already a rider. Open your dashboard →"
      : 'Skip EHB sign-up — add your vehicle details directly.'
    : 'Register on EHB, then add your vehicle details.';

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center gap-1 justify-center mb-2">
          <span className="text-3xl font-extrabold tracking-tight text-primary lowercase leading-none">gosellr</span>
          <span className="flex flex-col gap-0.5 mb-1.5">
            <span className="w-2 h-2 rounded-pill bg-accent" />
            <span className="w-2 h-2 rounded-pill bg-accent" />
          </span>
        </div>
        <p className="text-muted-foreground text-sm">Pakistan&apos;s most trusted marketplace</p>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-card border border-border p-8">
          {isLogged ? (
            <>
              <h1 className="text-xl font-bold text-foreground mb-1">Add another role</h1>
              <p className="text-sm text-muted-foreground mb-3">
                You&apos;re signed in as{' '}
                <span className="font-semibold text-foreground">{user!.full_name ?? user!.email}</span>{' '}
                ({userRole}). Pick what you want to do next.
              </p>
              <div className="bg-success-50 border border-success-100 rounded-xl px-4 py-2.5 mb-5 text-xs text-success-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Your EHB identity is verified. You won&apos;t be asked to re-register —
                  we&apos;ll take you straight to the next step.
                </span>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-foreground mb-1">Create your account</h1>
              <p className="text-sm text-muted-foreground mb-3">
                All accounts are managed through EHB — choose your role:
              </p>
              <div className="bg-accent-50 border border-accent-100 rounded-xl px-4 py-2.5 mb-5 text-xs text-accent-700 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  GoSellr uses <strong>EHB Identity</strong> for secure sign-up. You&apos;ll be redirected to EHB to create your account, then returned here.
                </span>
              </div>
            </>
          )}

          <div className="space-y-3">
            {/* Buyer */}
            <RoleButton
              onClick={() => handleRoleClick('buyer')}
              icon={ShoppingBag}
              iconBg="bg-accent-50"
              iconColor="text-accent"
              hoverIconBg="group-hover:bg-accent"
              hoverIconColor="group-hover:text-accent-foreground"
              title="Shop as a Buyer"
              tag={isLogged ? (userRole === 'buyer' ? 'Active' : 'No setup needed') : 'Via EHB · Free'}
              tagColor="bg-success-50 text-success-700"
              hint={buyerHint}
            />

            {/* Seller */}
            <RoleButton
              onClick={() => handleRoleClick('seller')}
              icon={Store}
              iconBg="bg-primary-50"
              iconColor="text-primary"
              hoverIconBg="group-hover:bg-primary"
              hoverIconColor="group-hover:text-primary-foreground"
              title="Sell as a Seller"
              tag={
                isLogged && userRole === 'seller'
                  ? 'Active'
                  : isLogged
                    ? 'Skip EHB · Set up store'
                    : 'SQ verification required'
              }
              tagColor="bg-accent-50 text-accent"
              hint={sellerHint}
            />

            {/* Rider */}
            <RoleButton
              onClick={() => handleRoleClick('rider')}
              icon={Truck}
              iconBg="bg-warning-50"
              iconColor="text-warning-500"
              hoverIconBg="group-hover:bg-warning-400"
              hoverIconColor="group-hover:text-warning-foreground"
              title="Earn as a Rider"
              tag={
                isLogged && userRole === 'rider'
                  ? 'Active'
                  : isLogged
                    ? 'Skip EHB · Add vehicle'
                    : 'CNIC & vehicle required'
              }
              tagColor="bg-warning-50 text-warning-500"
              hint={riderHint}
            />
          </div>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {isLogged ? (
              <>
                Not you?{' '}
                <Link href="/login" className="text-accent hover:text-accent-700 font-semibold inline-flex items-center gap-1">
                  <LogIn className="w-3.5 h-3.5" />
                  Switch account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="text-accent hover:text-accent-700 font-semibold">Sign in</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleButton({
  onClick, icon: Icon, iconBg, iconColor, hoverIconBg, hoverIconColor,
  title, tag, tagColor, hint,
}: {
  onClick: () => void;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  hoverIconBg: string;
  hoverIconColor: string;
  title: string;
  tag: string;
  tagColor: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-border hover:border-accent hover:bg-accent-50 rounded-xl p-4 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${iconBg} ${iconColor} ${hoverIconBg} ${hoverIconColor}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">{title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${tagColor}`}>
              {tag}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{hint}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </button>
  );
}
