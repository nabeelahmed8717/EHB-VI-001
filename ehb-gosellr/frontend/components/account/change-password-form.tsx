'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { useChangePasswordMutation } from '@/lib/store/api/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';

/**
 * ChangePasswordForm
 *
 * Adapts automatically based on whether the user has a local password:
 *  - EHB-only users: only "new password" fields shown  (setting for first time)
 *  - Local users:    "current password" + "new password" fields shown
 */
export function ChangePasswordForm() {
  const user = useSelector((s: RootState) => s.auth.user);
  const hasPassword = user?.has_password ?? false;

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    try {
      const body: { current_password?: string; new_password: string } = {
        new_password: newPassword,
      };
      if (hasPassword) {
        body.current_password = currentPassword;
      }
      const result = await changePassword(body).unwrap();
      setSuccess(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to update password.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {hasPassword ? 'Change Password' : 'Set a Password'}
          </CardTitle>
        </div>
        <CardDescription>
          {hasPassword
            ? 'Update your GoSellr account password.'
            : 'Your account uses EHB login. Set a local password to also sign in directly on GoSellr.'}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {success}
            </div>
          )}

          {/* Current password — only shown for users who already have one */}
          {hasPassword && (
            <div className="space-y-1">
              <Label htmlFor="current_password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="new_password">New Password</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNew ? 'text' : 'password'}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="Repeat new password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Updating…' : hasPassword ? 'Update Password' : 'Set Password'}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
