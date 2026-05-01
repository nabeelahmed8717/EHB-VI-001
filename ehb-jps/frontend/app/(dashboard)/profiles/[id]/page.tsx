'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Edit2,
  Send,
  Trash2,
  RefreshCw,
  MapPin,
  FileText,
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
  getPlatformLabel,
  formatDate,
  formatDateShort,
} from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_JPS_API_URL ?? 'http://localhost:3006';

// ── Document preview ──────────────────────────────────────────────────────────

function DocumentImage({ src, label }: { src: string | null; label: string }) {
  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 h-32 text-gray-400">
        <FileText className="h-5 w-5" />
        <p className="text-xs">Not uploaded</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 h-32">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${API_BASE}${src}`}
        alt={label}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // Auto-poll every 8s while PSS is processing — stops once a terminal state arrives.
  const PENDING_STATUSES = ['submitted', 'under_review'];
  const [pollingInterval, setPollingInterval] = useState(8_000);

  const { data: profile, isLoading, isError } = useGetProfileQuery(params.id, {
    pollingInterval,
  });

  // Stop polling once the profile reaches a terminal state (approved / rejected)
  useEffect(() => {
    if (profile && !PENDING_STATUSES.includes(profile.status)) {
      setPollingInterval(0);
    } else if (profile && PENDING_STATUSES.includes(profile.status)) {
      setPollingInterval(8_000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.status]);
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
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
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
            <p className="text-sm text-gray-500 ml-8">
              {getRoleLabel(profile.role)} · {getPlatformLabel(profile.platform)}
            </p>
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

        {(profile.status === 'submitted' || profile.status === 'under_review') && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-700">
              Your profile is currently being reviewed by PSS. You&apos;ll be notified when a
              decision is made.
            </p>
          </div>
        )}
      </div>

      {/* Profile details */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {/* Bio */}
        {profile.bio && (
          <div className="p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bio</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Description */}
        {profile.description && (
          <div className="p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Profile Description
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {profile.description}
            </p>
          </div>
        )}

        {/* Address */}
        {profile.address && (
          <div className="p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Address
            </h3>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <span>{profile.address}</span>
            </div>
          </div>
        )}
      </div>

      {/* Identity documents */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Identity Documents
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">CNIC Front</p>
            <DocumentImage src={profile.cnic_front} label="CNIC Front" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">CNIC Back</p>
            <DocumentImage src={profile.cnic_back} label="CNIC Back" />
          </div>
        </div>

        {profile.address_proof && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Address Proof</p>
            <DocumentImage src={profile.address_proof} label="Address Proof" />
          </div>
        )}
      </div>

      {/* PSS metadata */}
      {profile.pss_request_id && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            PSS Verification
          </h3>
          <dl className="space-y-2">
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-36">Request ID</dt>
              <dd className="text-sm text-gray-800 font-mono text-xs">{profile.pss_request_id}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-36">Last Updated</dt>
              <dd className="text-sm text-gray-800">{formatDate(profile.updated_at)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
