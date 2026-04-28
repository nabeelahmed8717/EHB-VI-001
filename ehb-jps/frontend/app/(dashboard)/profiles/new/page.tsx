'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useCreateProfileMutation } from '@/lib/store/api/profiles.api';
import { getRoleLabel, getRoleIcon } from '@/lib/utils';
import type { ProfileRole } from '@/types/jps.types';

// ── Types ─────────────────────────────────────────────────────────────────────

const ROLES: ProfileRole[] = ['worker', 'employer', 'freelancer', 'trainer', 'recruiter'];

const ROLE_DESCRIPTIONS: Record<ProfileRole, string> = {
  worker: 'Looking for employment opportunities',
  employer: 'Hiring talent for your organization',
  freelancer: 'Offering services on a project basis',
  trainer: 'Teaching skills and conducting training programs',
  recruiter: 'Connecting candidates with employers',
};

// ── Validation schema ─────────────────────────────────────────────────────────

const detailsSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters').max(80),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  // Worker fields
  skills: z.string().optional(),
  years_of_experience: z.coerce.number().min(0).max(50).optional(),
  // Employer fields
  company_name: z.string().max(100).optional(),
  industry: z.string().max(80).optional(),
  // Freelancer fields
  hourly_rate: z.coerce.number().min(0).optional(),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  // Trainer fields
  certifications: z.string().optional(),
  training_areas: z.string().optional(),
  // Recruiter fields
  agency_name: z.string().max(100).optional(),
  specialization: z.string().max(80).optional(),
});

type DetailsFormData = z.infer<typeof detailsSchema>;

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              i < current
                ? 'bg-blue-600 text-white'
                : i === current
                ? 'border-2 border-blue-600 text-blue-600 bg-white'
                : 'border-2 border-gray-200 text-gray-400 bg-white'
            }`}
          >
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-px w-8 ${i < current ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Role picker (step 0) ──────────────────────────────────────────────────────

function RolePicker({
  selected,
  onSelect,
}: {
  selected: ProfileRole | null;
  onSelect: (r: ProfileRole) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Choose the type of professional profile you want to create. You can have one profile per
        role.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => onSelect(role)}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              selected === role
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">{getRoleIcon(role)}</div>
            <p className="font-semibold text-gray-900 text-sm">{getRoleLabel(role)}</p>
            <p className="text-xs text-gray-500 mt-1">{ROLE_DESCRIPTIONS[role]}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Details form (step 1) ─────────────────────────────────────────────────────

function DetailsForm({
  role,
  form,
}: {
  role: ProfileRole;
  form: ReturnType<typeof useForm<DetailsFormData>>;
}) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-5">
      {/* Common fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('display_name')}
          placeholder="Your professional name"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.display_name && (
          <p className="text-xs text-red-500 mt-1">{errors.display_name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          {...register('bio')}
          rows={3}
          placeholder="A brief description of your professional background…"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
      </div>

      {/* Role-specific fields */}
      {role === 'worker' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <input
              {...register('skills')}
              placeholder="e.g. Carpentry, Welding, Plumbing (comma-separated)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience
            </label>
            <input
              {...register('years_of_experience')}
              type="number"
              min={0}
              max={50}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {role === 'employer' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              {...register('company_name')}
              placeholder="Your company or organization"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input
              {...register('industry')}
              placeholder="e.g. Construction, Healthcare, Technology"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {role === 'freelancer' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
            <input
              {...register('hourly_rate')}
              type="number"
              min={0}
              placeholder="0"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
            <input
              {...register('portfolio_url')}
              type="url"
              placeholder="https://yourportfolio.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.portfolio_url && (
              <p className="text-xs text-red-500 mt-1">{errors.portfolio_url.message}</p>
            )}
          </div>
        </>
      )}

      {role === 'trainer' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
            <input
              {...register('certifications')}
              placeholder="e.g. AWS Certified, PMP, TEFL"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Training Areas</label>
            <input
              {...register('training_areas')}
              placeholder="e.g. Leadership, Technical Skills, Sales"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {role === 'recruiter' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
            <input
              {...register('agency_name')}
              placeholder="Your recruitment agency (if any)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <input
              {...register('specialization')}
              placeholder="e.g. Tech, Finance, Healthcare"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Review step (step 2) ──────────────────────────────────────────────────────

function ReviewStep({ role, data }: { role: ProfileRole; data: DetailsFormData }) {
  const roleData = buildRoleData(role, data);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Review your profile details before creating. You can edit it before submitting for
        verification.
      </p>
      <div className="rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-200">
        <div className="px-5 py-4 flex gap-3 items-start">
          <span className="text-2xl">{getRoleIcon(role)}</span>
          <div>
            <p className="font-semibold text-gray-900">{data.display_name}</p>
            <p className="text-sm text-gray-500">{getRoleLabel(role)}</p>
          </div>
        </div>
        {data.bio && (
          <div className="px-5 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Bio</p>
            <p className="text-sm text-gray-700">{data.bio}</p>
          </div>
        )}
        {Object.keys(roleData).length > 0 && (
          <div className="px-5 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Role Details
            </p>
            <dl className="space-y-1.5">
              {Object.entries(roleData).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-xs text-gray-500 w-32 shrink-0">{k.replace(/_/g, ' ')}</dt>
                  <dd className="text-xs text-gray-800">{String(v ?? '—')}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-xs text-blue-700">
          After creating, your profile will be saved as a <strong>draft</strong>. Submit it when
          you're ready for PSS SQ verification.
        </p>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRoleData(role: ProfileRole, data: DetailsFormData): Record<string, unknown> {
  switch (role) {
    case 'worker':
      return {
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        years_of_experience: data.years_of_experience ?? 0,
      };
    case 'employer':
      return {
        company_name: data.company_name ?? '',
        industry: data.industry ?? '',
      };
    case 'freelancer':
      return {
        hourly_rate: data.hourly_rate ?? 0,
        portfolio_url: data.portfolio_url ?? '',
      };
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
      return {
        agency_name: data.agency_name ?? '',
        specialization: data.specialization ?? '',
      };
    default:
      return {};
  }
}

// ── Main wizard ───────────────────────────────────────────────────────────────

const STEPS = ['Choose Role', 'Profile Details', 'Review'];

export default function NewProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<ProfileRole | null>(null);
  const [createProfile, { isLoading, error }] = useCreateProfileMutation();

  const form = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {},
  });

  async function handleCreate() {
    if (!selectedRole) return;
    const data = form.getValues();
    const roleData = buildRoleData(selectedRole, data);
    try {
      const profile = await createProfile({
        role: selectedRole,
        display_name: data.display_name,
        bio: data.bio || undefined,
        role_data: roleData,
      }).unwrap();
      router.push(`/profiles/${profile._id}`);
    } catch {
      // error displayed below
    }
  }

  async function handleNext() {
    if (step === 0) {
      if (!selectedRole) return;
      setStep(1);
    } else if (step === 1) {
      const valid = await form.trigger(['display_name', 'bio', 'portfolio_url']);
      if (valid) setStep(2);
    } else {
      await handleCreate();
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Create Profile</h2>
          <p className="text-sm text-gray-500">{STEPS[step]}</p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} total={STEPS.length} />

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {step === 0 && (
          <RolePicker selected={selectedRole} onSelect={(r) => setSelectedRole(r)} />
        )}
        {step === 1 && selectedRole && (
          <DetailsForm role={selectedRole} form={form} />
        )}
        {step === 2 && selectedRole && (
          <ReviewStep role={selectedRole} data={form.getValues()} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            {(error as { data?: { message?: string } }).data?.message ?? 'Failed to create profile. Please try again.'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        <button
          onClick={handleNext}
          disabled={(step === 0 && !selectedRole) || isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {step === 2 ? (
            isLoading ? 'Creating…' : 'Create Profile'
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
