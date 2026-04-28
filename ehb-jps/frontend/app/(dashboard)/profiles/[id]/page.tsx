'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Edit2,
  Send,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  useGetProfileQuery,
  useSubmitProfileMutation,
  useDeleteProfileMutation,
} from '@/lib/store/api/profiles.api';
import { StatusBadge } from '@/components/profile/status-badge';
import { SqBadge } from '@/components/profile/sq-badge';
import {
  getRoleLabel,
  getRoleIcon,
  formatDate,
  formatDateShort,
} from '@/lib/utils';
import type { ProfileRole } from '@/types/jps.types';

// ── Role data display ─────────────────────────────────────────────────────────

function RoleDataSection({ role, data }: { role: ProfileRole; data: Record<string, unknown> }) {
  if (!data || Object.keys(data).length === 0) return null;

  const fields: Array<{ label: string; value: string }> = [];

  if (role === 'worker') {
    if (Array.isArray(data.skills) && data.skills.length > 0)
      fields.push({ label: 'Skills', value: (data.skills as string[]).join(', ') });
    if (data.years_of_experience !== undefined)
      fields.push({ label: 'Experience', value: `${data.years_of_experience} years` });
  } else if (role === 'employer') {
    if (data.company_name) fields.push({ label: 'Company', value: String(data.company_name) });
    if (data.industry) fields.push({ label: 'Industry', value: String(data.industry) });
  } else if (role === 'freelancer') {
    if (data.hourly_rate !== undefined)
      fields.push({ label: 'Hourly Rate', value: `$${data.hourly_rate}/hr` });
    if (data.portfolio_url)
      fields.push({ label: 'Portfolio', value: String(data.portfolio_url) });
  } else if (role === 'trainer') {
    if (Array.isArray(data.certifications) && data.certifications.length > 0)
      fields.push({ label: 'Certifications', value: (data.certifications as string[]).join(', ') });
    if (Array.isArray(data.training_areas) && data.training_areas.length > 0)
      fields.push({ label: 'Training Areas', value: (data.training_areas as string[]).join(', ') });
  } else if (role === 'recruiter') {
    if (data.agency_name) fields.push({ label: 'Agency', value: String(data.agency_name) });
    if (data.specialization)
      fields.push({ label: 'Specialization', value: String(data.specialization) });
  }

  if (fields.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Role Details</h3>
      <dl className="divide-y divide-gray-100">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex gap-4 py-2.5">
            <dt className="text-sm text-gray-500 w-36 shrink-0">{label}</dt>
            <dd className="text-sm text-gray-800">
              {label === 'Portfolio' ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  {value}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data: profile, isLoading, isError } = useGetProfileQuery(params.id);
  const [submitProfile, { isLoading: isSubmitting }] = useSubmitProfileMutation();
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation();

  async function handleSubmit() {
    if (!profile) return;
    if (!confirm('Submit this profile for PSS SQ verification?')) return;
    try {
      await submitProfile(profile._id).unwrap();
    } catch {
      alert('Failed to submit profile. Please try again.');
    }
  }

  async function handleDelete() {
    if (!profile) return;
    if (!confirm('Delete this profile? This cannot be undone.')) return;
    try {
      await deleteProfile(profile._id).unwrap();
      router.push('/dashboard');
    } catch {
      alert('Failed to delete profile. Please try again.');
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="skeleton h-8 w-48" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="skeleton h-6 w-64" />
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-20 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-600">Profile not found.</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            Back to My Profiles
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = profile.status === 'draft' || profile.status === 'resubmit_required';
  const canSubmit = profile.status === 'draft' || profile.status === 'resubmit_required';
  const canDelete = profile.status === 'draft' || profile.status === 'rejected';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              <h2 className="text-xl font-semibold text-gray-900">{profile.display_name}</h2>
            </div>
            <p className="text-sm text-gray-500 ml-8">{getRoleLabel(profile.role)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/profiles/${profile._id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Link>
          )}
          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {isSubmitting ? 'Submitting…' : 'Submit for SQ'}
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Status + SQ card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <StatusBadge status={profile.status} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">SQ Level</p>
              <SqBadge level={profile.sq_level} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Updated {formatDateShort(profile.updated_at)}</p>
            <p className="text-xs text-gray-400">Created {formatDateShort(profile.created_at)}</p>
          </div>
        </div>

        {/* Rejection reason */}
        {profile.rejection_reason && (
          <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-xs font-medium text-orange-700 mb-1">Rejection Reason</p>
            <p className="text-sm text-orange-800">{profile.rejection_reason}</p>
          </div>
        )}

        {/* Submitted/under review notice */}
        {(profile.status === 'submitted' || profile.status === 'under_review') && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-700">
              Your profile is currently being reviewed by PSS. You'll be notified when a decision is
              made.
            </p>
          </div>
        )}
      </div>

      {/* Profile details card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5 divide-y divide-gray-100">
        {/* Bio */}
        {profile.bio && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Role data */}
        <div className={profile.bio ? 'pt-5' : ''}>
          <RoleDataSection
            role={profile.role as ProfileRole}
            data={profile.role_data as Record<string, unknown>}
          />
        </div>
      </div>

      {/* PSS metadata */}
      {profile.pss_request_id && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">PSS Verification</h3>
          <dl className="space-y-2">
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-36">Request ID</dt>
              <dd className="text-sm text-gray-800 font-mono">{profile.pss_request_id}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
