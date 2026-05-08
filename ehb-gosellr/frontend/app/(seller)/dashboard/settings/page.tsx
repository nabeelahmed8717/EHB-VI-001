'use client';

import { useState, useEffect } from 'react';
import { useGetSellerProfileQuery, useUpdateSellerProfileMutation } from '@/lib/store/api/seller.api';

const BUSINESS_TYPES = ['Retail', 'Wholesale', 'Manufacturing', 'Service', 'Other'];
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Food', 'Health', 'Other'];

export default function SellerSettingsPage() {
  const { data: profile, isLoading } = useGetSellerProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateSellerProfileMutation();

  const [businessName, setBusinessName]       = useState('');
  const [businessType, setBusinessType]       = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [bankName, setBankName]               = useState('');
  const [accountTitle, setAccountTitle]       = useState('');
  const [accountNumber, setAccountNumber]     = useState('');
  const [iban, setIban]                       = useState('');
  const [success, setSuccess]                 = useState('');
  const [error, setError]                     = useState('');

  // Pre-fill from existing profile
  useEffect(() => {
    if (!profile) return;
    setBusinessName(profile.business_name ?? '');
    setBusinessType(profile.business_type ?? '');
    setBusinessCategory(profile.business_category ?? '');
    setStoreDescription(profile.store_description ?? '');
    setBankName(profile.bank_info?.bank_name ?? '');
    setAccountTitle(profile.bank_info?.account_title ?? '');
    setAccountNumber(profile.bank_info?.account_number ?? '');
    setIban(profile.bank_info?.iban ?? '');
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await updateProfile({
        business_name: businessName,
        business_type: businessType,
        business_category: businessCategory,
        store_description: storeDescription,
        ...(bankName ? {
          bank_info: {
            bank_name: bankName,
            account_title: accountTitle,
            account_number: accountNumber,
            iban,
          },
        } : {}),
      }).unwrap();
      setSuccess('Store profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } }).data?.message;
      setError(msg ?? 'Failed to update profile');
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Store Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your store information and bank details
        </p>
      </div>

      {/* SQ Badge */}
      {profile && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          profile.sq_status === 'approved'
            ? 'bg-success-50 border-success-100'
            : profile.sq_status === 'pending'
            ? 'bg-warning-50 border-warning-100'
            : 'bg-surface-alt border-border'
        }`}>
          <span className="text-xl">
            {profile.sq_status === 'approved' ? '🛡️' : profile.sq_status === 'pending' ? '⏳' : '📋'}
          </span>
          <div>
            <div className="font-semibold text-sm text-foreground">
              SQ Status: <span className={
                profile.sq_status === 'approved' ? 'text-success-700' :
                profile.sq_status === 'pending' ? 'text-warning-500' : 'text-muted-foreground'
              }>{profile.sq_badge_label ?? profile.sq_status}</span>
            </div>
            {profile.sq_level && (
              <div className="text-xs text-muted-foreground">Trust Level {profile.sq_level}</div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Store Info ── */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Store Information</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Store / Business name <span className="text-destructive">*</span>
            </label>
            <input
              required
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Sara's Online Store"
              className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Business type <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select…</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={businessCategory}
                onChange={e => setBusinessCategory(e.target.value)}
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Store description
            </label>
            <textarea
              rows={3}
              value={storeDescription}
              onChange={e => setStoreDescription(e.target.value)}
              placeholder="Tell buyers about your store, what you sell, and why they should trust you…"
              className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
        </div>

        {/* ── Bank Details ── */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">Bank Details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Used for payouts. Kept secure and never shared publicly.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Bank name</label>
              <input
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="HBL, MCB, Meezan…"
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Account title</label>
              <input
                value={accountTitle}
                onChange={e => setAccountTitle(e.target.value)}
                placeholder="As on CNIC / bank statement"
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Account number</label>
            <input
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="00427901298630"
              className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">IBAN</label>
            <input
              value={iban}
              onChange={e => setIban(e.target.value)}
              placeholder="PK36HABB0000427901298630"
              className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-success-50 border border-success-100 text-success-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            ✅ {success}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-accent text-white font-semibold rounded-xl
              hover:bg-accent-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!profile) return;
              setBusinessName(profile.business_name ?? '');
              setBusinessType(profile.business_type ?? '');
              setBusinessCategory(profile.business_category ?? '');
              setStoreDescription(profile.store_description ?? '');
              setBankName(profile.bank_info?.bank_name ?? '');
              setAccountTitle(profile.bank_info?.account_title ?? '');
              setAccountNumber(profile.bank_info?.account_number ?? '');
              setIban(profile.bank_info?.iban ?? '');
              setError(''); setSuccess('');
            }}
            className="px-6 py-2.5 border border-border text-muted-foreground font-semibold rounded-xl
              hover:bg-surface-alt transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
