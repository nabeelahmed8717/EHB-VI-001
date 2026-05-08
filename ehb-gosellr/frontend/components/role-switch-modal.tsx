'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Store, ShoppingBag, Truck, ArrowLeftRight, Loader2, X } from 'lucide-react';
import { setCredentials } from '@/lib/store/auth.slice';
import { useSwitchRoleMutation } from '@/lib/store/api/auth.api';
import type { RootState } from '@/lib/store';

interface RoleSwitchModalProps {
  /** The role this page requires */
  targetRole: 'buyer' | 'seller' | 'rider';
  /** Called when the user clicks "Go back" */
  onDismiss: () => void;
}

const ROLE_META = {
  buyer: {
    label: 'Buyer',
    icon: ShoppingBag,
    color: 'text-accent',
    ringColor: 'ring-accent',
    bg: 'bg-accent-50',
    desc: 'browse products, manage your cart, and place orders',
  },
  seller: {
    label: 'Seller',
    icon: Store,
    color: 'text-primary',
    ringColor: 'ring-primary',
    bg: 'bg-primary-50',
    desc: 'manage your store, products, and orders',
  },
  rider: {
    label: 'Rider',
    icon: Truck,
    color: 'text-warning-500',
    ringColor: 'ring-warning-400',
    bg: 'bg-warning-50',
    desc: 'pick up and deliver orders',
  },
} as const;

export function RoleSwitchModal({ targetRole, onDismiss }: RoleSwitchModalProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const [switchRole, { isLoading }] = useSwitchRoleMutation();
  const [error, setError] = useState<string | null>(null);

  const currentRole = (user?.role ?? 'buyer') as 'buyer' | 'seller' | 'rider';
  const current = ROLE_META[currentRole];
  const target = ROLE_META[targetRole];
  const CurrentIcon = current.icon;
  const TargetIcon = target.icon;

  async function handleSwitch() {
    setError(null);
    try {
      const res = await switchRole({ role: targetRole }).unwrap();
      dispatch(setCredentials({ user: res.user, token: res.access_token }));
      // No navigation needed — the layout re-renders with the new role
      // and renders the page content automatically.
    } catch (err: unknown) {
      setError(
        (err as { data?: { message?: string } })?.data?.message ??
        'Role switch failed. Please try again.',
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Switch Mode</h2>
          <button
            onClick={onDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-alt text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Role transition visual */}
          <div className="flex items-center gap-3">
            {/* Current role */}
            <div className={`flex-1 rounded-xl border border-border ${current.bg} p-3.5 flex flex-col items-center gap-2`}>
              <div className={`w-9 h-9 rounded-full bg-white/70 flex items-center justify-center ring-2 ${current.ringColor}/30`}>
                <CurrentIcon className={`w-5 h-5 ${current.color}`} />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">{current.label}</p>
                <p className="text-[10px] text-muted-foreground">Current</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Target role */}
            <div className={`flex-1 rounded-xl border-2 border-accent ${target.bg} p-3.5 flex flex-col items-center gap-2`}>
              <div className={`w-9 h-9 rounded-full bg-white/70 flex items-center justify-center ring-2 ${target.ringColor}/40`}>
                <TargetIcon className={`w-5 h-5 ${target.color}`} />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">{target.label}</p>
                <p className="text-[10px] text-muted-foreground">Switch to</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            This page requires{' '}
            <span className="font-semibold text-foreground">{target.label} mode</span>.
            Switch to {target.desc}.
          </p>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 text-center">
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={handleSwitch}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-accent-foreground font-semibold text-sm py-2.5 rounded-pill transition-colors"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Switching…</>
              : <><ArrowLeftRight className="w-4 h-4" /> Switch to {target.label} Mode</>
            }
          </button>
          <button
            onClick={onDismiss}
            className="w-full text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
