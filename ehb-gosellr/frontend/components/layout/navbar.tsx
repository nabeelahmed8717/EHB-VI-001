'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/lib/store/auth.slice';
import { useLogoutServerMutation } from '@/lib/store/api/auth.api';
import type { RootState } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ShoppingBag, LogOut, User, Settings, Loader2 } from 'lucide-react';

export function Navbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const [logoutServer] = useLogoutServerMutation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Revoke token server-side (increments token_version in DB)
      await logoutServer().unwrap();
    } catch {
      // If the server call fails (token already expired, network error, etc.)
      // we still clear local state — best-effort revocation
    } finally {
      // 2. Always clear localStorage + Redux state
      dispatch(logout());
      setIsLoggingOut(false);
      router.push('/login');
    }
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <ShoppingBag className="h-5 w-5" />
          GoSellr
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-4 w-4" />
                {user.full_name}
                <span className="ml-1 text-xs bg-secondary rounded px-1">{user.role}</span>
              </span>
              {user.role === 'seller' && (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
              )}
              {user.role === 'buyer' && (
                <Link href="/browse">
                  <Button variant="ghost" size="sm">Browse</Button>
                </Link>
              )}
              <Link
                href={
                  user.role === 'seller'
                    ? '/dashboard/settings'
                    : '/settings'
                }
              >
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-1" /> Settings
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-1" />
                )}
                {isLoggingOut ? 'Logging out…' : 'Logout'}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link href="/register"><Button size="sm">Register</Button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
