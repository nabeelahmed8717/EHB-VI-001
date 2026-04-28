'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Save } from 'lucide-react';
import { useGetProfileQuery, useUpdateProfileMutation } from '@/lib/store/api/profiles.api';
import { getRoleLabel, getRoleIcon } from '@/lib/utils';
import type { ProfileRole } from '@/types/jps.types';

// ── Validation schema ─────────────────────────────────────────────────────────

const editSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters').max(80),
  bio: z.string().max(500).optional(),
  // Worker
  skills: z.string().optional(),
  years_of_experience: z.coerce.number().min(0).max(50).optional(),
  // Employer
  company_name: z.string().max(100).optional(),
  industry: z.string().max(80).optional(),
  // Freelancer
  hourly_rate: z.coerce.number().min(0).optional(),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  // Trainer
  certifications: z.string().optional(),
  training_areas: z.string().optional(),
  // Recruiter
  agency_name: z.string().max(100).optional(),
  specialization: z.string().max(80).optional(),
});

type EditFormData = z.infer<typeof editSchema>;

// ── Role-specific fields ──────────────────────────────────────────────────────

function RoleFields({
  role,
  register,
  errors,
}: {
  role: ProfileRole;
  register: ReturnType<typeof useForm<EditFormData>>['register'];
  errors: ReturnType<typeof useForm<EditFormData>>['formState']['errors'];
}) {
  if (role === 'worker') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
          <input
            {...register('skills')}
            placeholder="e.g. Carpentry, Welding (comma-separated)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
          <input
            {...register('years_of_experience')}
            type="number"
            min={0}
            max={50}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </>
    );
  }

  if (role === 'employer') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            {...register('company_name')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <input
            {...register('industry')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </>
    );
  }

  if (role === 'freelancer') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
          <input
            {...register('hourly_rate')}
            type="number"
            min={0}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
          <input
            {...register('portfolio_url')}
            type="url"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.portfolio_url && (
            <p className="text-xs text-red-500 mt-1">{errors.portfolio_url.message}</p>
          )}
        </div>
      </>
    );
  }

  if (role === 'trainer') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
          <input
            {...register('certifications')}
            placeholder="Comma-separated"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Training Areas</label>
          <input
            {...register('training_areas')}
            placeholder="Comma-separated"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </>
    );
  }

  if (role === 'recruiter') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
          <input
            {...register('agency_name')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
          <input
            {...register('specialization')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </>
    );
  }

  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRoleData(role: ProfileRole, data: EditFormData): Record<string, unknown> {
  switch (role) {
    case 'worker':
      return {
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        years_of_experience: data.years_of_experience ?? 0,
      };
    case 'employer':
      return { company_name: data.company_name ?? '', industry: data.industry ?? '' };
    case 'freelancer':
      return { hourly_rate: data.hourly_rate ?? 0, portfolio_url: data.portfolio_url ?? '' };
    case 'trainer':
      return {
        certifications: data.certifications
          ? data.certifications.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        training_areas: data.training_areas
          ? data.training_areas.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
    case 'recruiter':
      return { agency_name: data.agency_name ?? '', specialization: data.specialization ?? '' };
    default:
      return {};
  }
}

function roleDataToFormValues(role: ProfileRole, roleData: Record<string, unknown>): Partial<EditFormData> {
  switch (role) {
    case 'worker':
      return {
        skills: Array.isArray(roleData.skills) ? (roleData.skills as string[]).join(', ') : '',
        years_of_experience: (roleData.years_of_experience as number) ?? 0,
      };
    case 'employer':
      return {
        company_name: String(roleData.company_name ?? ''),
        industry: String(roleData.industry ?? ''),
      };
    case 'freelancer':
      return {
        hourly_rate: (roleData.hourly_rate as number) ?? 0,
        portfolio_url: String(roleData.portfolio_url ?? ''),
      };
    case 'trainer':
      return {
        certifications: Array.isArray(roleData.certifications)
          ? (roleData.certifications as string[]).join(', ')
          : '',
        training_areas: Array.isArray(roleData.training_areas)
          ? (roleData.training_areas as string[]).join(', ')
          : '',
      };
    case 'recruiter':
      return {
        agency_name: String(roleData.agency_name ?? ''),
        specialization: String(roleData.specialization ?? ''),
      };
    default:
      return {};
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data: profile, isLoading } = useGetProfileQuery(params.id);
  const [updateProfile, { isLoading: isSaving, error }] = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  // Pre-fill form once profile loads
  useEffect(() => {
    if (!profile) return;
    const roleValues = roleDataToFormValues(
      profile.role as ProfileRole,
      (profile.role_data as Record<string, unknown>) ?? {},
    );
    reset({
      display_name: profile.display_name,
      bio: profile.bio ?? '',
      ...roleValues,
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
    const roleData = buildRoleData(profile.role as ProfileRole, data);
    try {
      await updateProfile({
        id: profile._id,
        body: {
          display_name: data.display_name,
          bio: data.bio || undefined,
          role_data: roleData,
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
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
          <p className="text-sm text-gray-500 ml-8">{getRoleLabel(profile.role)}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('display_name')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Separator */}
          <div className="border-t border-gray-100 pt-5 space-y-5">
            <p className="text-sm font-semibold text-gray-700">Role Details</p>
            <RoleFields
              role={profile.role as ProfileRole}
              register={register}
              errors={errors}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              {(error as { data?: { message?: string } }).data?.message ?? 'Failed to save. Please try again.'}
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
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
