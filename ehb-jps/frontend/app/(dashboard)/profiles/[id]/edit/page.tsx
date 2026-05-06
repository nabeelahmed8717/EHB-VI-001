'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Save } from 'lucide-react';
import { useGetProfileQuery, useUpdateProfileMutation } from '@/lib/store/api/profiles.api';
import { ImageUpload } from '@/components/profile/image-upload';
import { getRoleLabel, getRoleIcon, getPlatformLabel } from '@/lib/utils';

// ── Validation schema ─────────────────────────────────────────────────────────

const editSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(80, 'Display name must be at most 80 characters'),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  cnic_front: z.string().nullable().optional(),
  cnic_back: z.string().nullable().optional(),
  address: z.string().max(300, 'Address must be at most 300 characters').optional(),
  address_proof: z.string().nullable().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data: profile, isLoading } = useGetProfileQuery(params.id);
  const [updateProfile, { isLoading: isSaving, error }] = useUpdateProfileMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  // Pre-fill form once profile loads
  useEffect(() => {
    if (!profile) return;
    reset({
      display_name: profile.display_name,
      bio: profile.bio ?? '',
      description: profile.description ?? '',
      cnic_front: profile.cnic_front ?? null,
      cnic_back: profile.cnic_back ?? null,
      address: profile.address ?? '',
      address_proof: profile.address_proof ?? null,
    });
  }, [profile, reset]);

  // Guard: only editable if draft or resubmit_required
  useEffect(() => {
    if (profile && profile.status !== 'draft' && profile.status !== 'resubmit_required') {
      router.replace(`/profiles/${params.id}`);
    }
  }, [profile, params.id, router]);

  async function onSubmit(data: EditFormData) {
    if (!profile) return;
    try {
      await updateProfile({
        id: profile._id,
        body: {
          display_name: data.display_name,
          bio: data.bio || undefined,
          description: data.description || undefined,
          cnic_front: data.cnic_front ?? undefined,
          cnic_back: data.cnic_back ?? undefined,
          address: data.address || undefined,
          address_proof: data.address_proof ?? undefined,
        },
      }).unwrap();
      router.push(`/profiles/${profile._id}`);
    } catch {
      // error displayed below
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="skeleton h-8 w-48" />
        <div className="rounded-xl border border-gray-100 bg-white shadow-card p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
    );
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
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{getRoleIcon(profile.role)}</span>
            <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          </div>
          <p className="text-sm text-gray-500 ml-8">
            {getRoleLabel(profile.role)} · {getPlatformLabel(profile.platform)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Basic Info ─────────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-100 bg-white shadow-card p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Basic Information
          </h3>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('display_name')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.display_name && (
              <p className="text-xs text-red-500 mt-1">{errors.display_name.message}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              {...register('bio')}
              rows={2}
              placeholder="A short one-liner about yourself"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Describe your experience, skills, and what you're looking for…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>
        </section>

        {/* ── Identity Documents ───────────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-100 bg-white shadow-card p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Identity Documents
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        <section className="rounded-xl border border-gray-100 bg-white shadow-card p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Address</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="Your current residential address"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          <Controller
            name="address_proof"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Address Proof"
                hint="Utility bill, bank statement, or government letter"
                value={field.value ?? null}
                onChange={field.onChange}
                error={errors.address_proof?.message}
              />
            )}
          />
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              {(error as { data?: { message?: string } }).data?.message ??
                'Failed to save. Please try again.'}
            </p>
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
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
