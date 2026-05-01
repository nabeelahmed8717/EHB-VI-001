'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Briefcase } from 'lucide-react';
import { useCreateProfileMutation } from '@/lib/store/api/profiles.api';
import { ImageUpload } from '@/components/profile/image-upload';
import type { EhbPlatform, ProfileRole } from '@/types/jps.types';

// ── Constants ─────────────────────────────────────────────────────────────────

const EHB_PLATFORMS: { id: EhbPlatform; label: string }[] = [
  { id: 'gosellr', label: 'GoSellr — Marketplace' },
  { id: 'jps',     label: 'JPS — Job Providing Service' },
  { id: 'hps',     label: 'HPS — Healthcare Platform' },
  { id: 'ols',     label: 'OLS — Legal Marketplace' },
  { id: 'wms',     label: 'WMS — Hospital Management' },
  { id: 'obs',     label: 'OBS — Book Retail' },
];

const PROFILE_ROLES: { value: ProfileRole; label: string; icon: string }[] = [
  { value: 'seller',      label: 'Seller',              icon: '🛍️' },
  { value: 'buyer',       label: 'Buyer',               icon: '🛒' },
  { value: 'rider',       label: 'Rider / Delivery',    icon: '🛵' },
  { value: 'chef',        label: 'Chef / Cook',         icon: '👨‍🍳' },
  { value: 'driver',      label: 'Driver',              icon: '🚗' },
  { value: 'cleaner',     label: 'Cleaner',             icon: '🧹' },
  { value: 'electrician', label: 'Electrician',         icon: '⚡' },
  { value: 'plumber',     label: 'Plumber',             icon: '🔧' },
  { value: 'trainer',     label: 'Trainer / Instructor',icon: '🎓' },
  { value: 'worker',      label: 'Worker',              icon: '👷' },
  { value: 'employer',    label: 'Employer',            icon: '🏢' },
  { value: 'freelancer',  label: 'Freelancer',          icon: '💼' },
  { value: 'recruiter',   label: 'Recruiter',           icon: '🔍' },
  { value: 'doctor',      label: 'Doctor',              icon: '🩺' },
  { value: 'nurse',       label: 'Nurse',               icon: '💉' },
  { value: 'lawyer',      label: 'Lawyer',              icon: '⚖️' },
  { value: 'teacher',     label: 'Teacher',             icon: '📚' },
  { value: 'other',       label: 'Other',               icon: '👤' },
];

// ── Validation schema ─────────────────────────────────────────────────────────

const schema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(80, 'Display name must be at most 80 characters'),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  platform: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(
      ['gosellr', 'jps', 'hps', 'ols', 'wms', 'obs'] as [EhbPlatform, ...EhbPlatform[]],
      { required_error: 'Please select a platform' },
    ),
  ),
  role: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(
      [
        'seller', 'buyer', 'rider', 'chef', 'driver',
        'cleaner', 'electrician', 'plumber', 'trainer',
        'worker', 'employer', 'freelancer', 'recruiter',
        'doctor', 'nurse', 'lawyer', 'teacher', 'other',
      ] as [ProfileRole, ...ProfileRole[]],
      { required_error: 'Please select a role' },
    ),
  ),
  cnic_front: z.string().nullable().optional(),
  cnic_back: z.string().nullable().optional(),
  address: z.string().max(300, 'Address must be at most 300 characters').optional(),
  address_proof: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Field components ──────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

// ── Select dropdown ───────────────────────────────────────────────────────────

function SelectField({
  label,
  required,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        {...props}
      >
        {children}
      </select>
      <FieldError message={error} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NewProfilePage() {
  const router = useRouter();
  const [createProfile, { isLoading }] = useCreateProfileMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bio: '',
      description: '',
      address: '',
      cnic_front: null,
      cnic_back: null,
      address_proof: null,
    },
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      const profile = await createProfile({
        platform: data.platform,
        role: data.role,
        display_name: data.display_name,
        bio: data.bio || undefined,
        description: data.description || undefined,
        cnic_front: data.cnic_front ?? undefined,
        cnic_back: data.cnic_back ?? undefined,
        address: data.address || undefined,
        address_proof: data.address_proof ?? undefined,
      }).unwrap();
      router.push(`/profiles/${profile._id}`);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setServerError(apiErr?.data?.message ?? 'Failed to create profile. Please try again.');
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Profile</h2>
            <p className="text-sm text-gray-500">Fill in your professional details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Basic Info ─────────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Basic Information
          </h3>

          {/* Display Name */}
          <div>
            <FieldLabel required>Display Name</FieldLabel>
            <input
              {...register('display_name')}
              placeholder="Your professional name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FieldError message={errors.display_name?.message} />
          </div>

          {/* Bio */}
          <div>
            <FieldLabel>Bio</FieldLabel>
            <textarea
              {...register('bio')}
              rows={2}
              placeholder="A short one-liner about yourself (max 500 characters)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <FieldError message={errors.bio?.message} />
          </div>

          {/* Profile Description */}
          <div>
            <FieldLabel>Profile Description</FieldLabel>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Describe your experience, skills, and what you're looking for…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <FieldError message={errors.description?.message} />
          </div>
        </section>

        {/* ── Platform & Role ─────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Platform &amp; Role
          </h3>

          {/* Select Platform */}
          <div>
            <FieldLabel required>Select Platform</FieldLabel>
            <select
              {...register('platform')}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              defaultValue=""
            >
              <option value="" disabled>Choose an EHB platform…</option>
              {EHB_PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <FieldError message={errors.platform?.message} />
          </div>

          {/* Select Role */}
          <div>
            <FieldLabel required>Select Profile Role</FieldLabel>
            <p className="text-xs text-gray-400 mb-2">One profile per platform + role combination</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <>
                    {PROFILE_ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => field.onChange(r.value)}
                        className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all ${
                          field.value === r.value
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-base leading-none">{r.icon}</span>
                        <span className="font-medium text-xs leading-tight">{r.label}</span>
                      </button>
                    ))}
                  </>
                )}
              />
            </div>
            <FieldError message={errors.role?.message} />
          </div>
        </section>

        {/* ── Identity Documents ───────────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Identity Documents
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Required for PSS SQ verification. Upload clear photos of your CNIC.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* CNIC Front */}
            <Controller
              name="cnic_front"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  label="CNIC Front"
                  hint="Front side of your National ID"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  error={errors.cnic_front?.message}
                />
              )}
            />

            {/* CNIC Back */}
            <Controller
              name="cnic_back"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  label="CNIC Back"
                  hint="Back side of your National ID"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  error={errors.cnic_back?.message}
                />
              )}
            />
          </div>
        </section>

        {/* ── Address ──────────────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Address
          </h3>

          {/* Address text */}
          <div>
            <FieldLabel>Address</FieldLabel>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="Your current residential address"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <FieldError message={errors.address?.message} />
          </div>

          {/* Address Proof */}
          <Controller
            name="address_proof"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Address Proof"
                hint="Utility bill, bank statement, or government letter (max 5 MB)"
                value={field.value ?? null}
                onChange={field.onChange}
                error={errors.address_proof?.message}
              />
            )}
          />
        </section>

        {/* ── Draft notice ─────────────────────────────────────────────────────── */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-xs text-blue-700">
            Your profile will be saved as a <strong>draft</strong>. You can review and submit it
            for PSS SQ verification whenever you&apos;re ready.
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating…' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
