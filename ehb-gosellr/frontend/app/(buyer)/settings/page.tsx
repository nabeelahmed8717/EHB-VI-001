import { ChangePasswordForm } from '@/components/account/change-password-form';

export default function BuyerSettingsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your GoSellr account security
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
