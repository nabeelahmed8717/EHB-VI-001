'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/lib/store/auth.slice';
import { useLoginMutation } from '@/lib/store/api/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShoppingBag, Eye, EyeOff, Shield } from 'lucide-react';

const EHB_URL = process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000';

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleEhbLogin = () => {
    window.location.href = `${EHB_URL}/login?redirect=gosellr`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.access_token }));
      // Honour the saved destination (e.g. /cart) that the buyer layout stored
      // before redirecting to login, then clear it.
      const next =
        typeof window !== 'undefined' ? localStorage.getItem('gosellr_next') : null;
      if (next) localStorage.removeItem('gosellr_next');
      if (next) {
        router.push(next);
      } else if (result.user.role === 'seller') {
        router.push('/dashboard');
      } else if (result.user.role === 'rider') {
        router.push('/dashboard/rider');
      } else {
        router.push('/browse');
      }
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        'Login failed. Check your credentials.';
      const isEhbOnly =
        typeof msg === 'string' && msg.toLowerCase().includes('ehb login');
      if (isEhbOnly) {
        window.location.href = `${EHB_URL}/login?redirect=gosellr`;
        return;
      }
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
      <Card className="w-full max-w-sm shadow-lg border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-pill bg-accent/10 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl">Sign in to GoSellr</CardTitle>
          <CardDescription>
            Use your EHB account or email &amp; password
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <Button
            type="button"
            variant="primary"
            className="w-full gap-2"
            onClick={handleEhbLogin}
          >
            <Shield className="h-4 w-4" />
            Login with EHB
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign In with Email'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => { window.location.href = `${EHB_URL}/register?redirect=gosellr`; }}
              className="text-accent hover:underline font-semibold"
            >
              Create account on EHB
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
