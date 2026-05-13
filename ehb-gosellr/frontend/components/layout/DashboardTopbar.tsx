'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { logout } from '@/lib/store/auth.slice';
import { useLogoutServerMutation } from '@/lib/store/api/auth.api';
import { ChevronDown, Home, LogOut, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface Props {
  /** Optional subtitle for the topbar — e.g. business name. Renders left-aligned. */
  subtitle?: string | null;
  /** Slot to render extra content in the topbar's empty middle area. */
  middleSlot?: React.ReactNode;
}

/**
 * Reusable dashboard topbar.
 *
 * Mirrors the wireframe: a navbar pinned to the top of the right-hand
 * column, with the notification bell and a profile dropdown anchored to
 * the far right. Use inside any role layout that already provides the
 * left sidebar.
 *
 * Profile dropdown contents:
 *   - Display name + email + role badge
 *   - Go to Main (returns to the public site)
 *   - Log out (revokes session, clears auth state)
 *
 * Drop-down closes on outside click and on route change.
 */
export function DashboardTopbar({ subtitle, middleSlot }: Props) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const [logoutServer, { isLoading: loggingOut }] = useLogoutServerMutation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logoutServer().unwrap().catch(() => undefined);
    dispatch(logout());
    router.push('/');
  }

  const firstName = user?.full_name?.split(' ')[0] ?? user?.email ?? 'Account';
  const initial = (user?.full_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : null;

  return (
    <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center px-6 gap-4">
      {/* Left slot: optional subtitle */}
      <div className="min-w-0 hidden md:block">
        {subtitle && (
          <p className="text-sm font-semibold text-foreground truncate max-w-[20rem]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Middle slot — search, breadcrumbs, whatever the page wants. */}
      <div className="flex-1 flex items-center justify-center">
        {middleSlot}
      </div>

      {/* Right cluster: notifications + profile */}
      <div className="flex items-center gap-3 ml-auto">
        <NotificationBell size="sm" />

        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-pill bg-surface-alt hover:bg-surface-muted transition-colors"
            aria-label="Profile menu"
            aria-expanded={open}
          >
            <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
              {initial}
            </span>
            <span className="hidden sm:inline text-sm font-semibold text-foreground max-w-[8rem] truncate">
              {firstName}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-40">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  {user?.full_name ?? 'Account'}
                </p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3" />
                  {user?.email}
                </p>
                {roleLabel && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-accent/10 text-accent">
                    <ShieldCheck className="w-3 h-3" />
                    {roleLabel}
                  </span>
                )}
              </div>

              <div className="py-1">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-alt transition-colors"
                >
                  <Home className="w-4 h-4 text-muted-foreground" />
                  Go to Main
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                  {loggingOut ? 'Logging out…' : 'Log out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
