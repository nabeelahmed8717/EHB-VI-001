'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Edit2,
  Trash2,
  RefreshCw,
  MapPin,
  FileText,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Lock,
  RotateCcw,
  CalendarDays,
  Hash,
  Star,
  AlertTriangle,
  X,
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
    <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50 h-32">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${API_BASE}${src}`} alt={label} className="w-full h-full object-contain" />
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

interface DeleteModalProps {
  profileName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({ profileName, isDeleting, onConfirm, onCancel }: DeleteModalProps) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={!isDeleting ? onCancel : undefined}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">

        {/* Close button */}
        {!isDeleting && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          {/* Red warning icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border-4 border-red-100">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Delete Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            You are about to permanently delete{' '}
            <span className="font-semibold text-gray-800">&ldquo;{profileName}&rdquo;</span>.
          </p>
        </div>

        {/* Irreversible warning banner */}
        <div className="mx-6 mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs text-red-700 space-y-1">
            <p className="font-semibold">This action is irreversible.</p>
            <p>
              All profile data, uploaded documents, and PSS verification history will be
              permanently removed and cannot be recovered.
            </p>
          </div>
        </div>

        {/* What will be deleted checklist */}
        <div className="mx-6 mb-6 space-y-1.5">
          {[
            'Profile information & bio',
            'Identity documents (CNIC, address proof)',
            'PSS submission history',
            'Any assigned SQ level record',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-gray-500">
              <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Yes, Delete Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PSS Timeline event ────────────────────────────────────────────────────────

interface TimelineEvent {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  description: string;
  date: string | null;
}

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const Icon = event.icon;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${event.iconBg}`}>
          <Icon className={`h-4 w-4 ${event.iconColor}`} />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-gray-100 min-h-[20px]" />}
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-sm font-medium text-gray-800">{event.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
        {event.date && (
          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {event.date}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Build timeline from profile data ─────────────────────────────────────────

function buildTimeline(profile: {
  status: string;
  pss_request_id: string | null;
  rejection_reason: string | null;
  sq_level: number | null;
  created_at: string;
  updated_at: string;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    icon: FileText,
    iconColor: 'text-gray-500',
    iconBg: 'bg-gray-100',
    label: 'Profile Created',
    description: 'Profile saved as draft',
    date: formatDateShort(profile.created_at),
  });

  if (profile.pss_request_id) {
    events.push({
      icon: Send,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
      label: 'Submitted to PSS',
      description: 'Request sent for SQ verification',
      date: null,
    });
  }

  if (profile.status === 'under_review') {
    events.push({
      icon: Clock,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-50',
      label: 'Under Review',
      description: 'PSS is reviewing your profile',
      date: formatDateShort(profile.updated_at),
    });
  }

  if (profile.status === 'approved') {
    events.push({
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
      label: 'Approved by PSS',
      description: profile.sq_level ? `SQ Level ${profile.sq_level} assigned` : 'Profile approved',
      date: formatDateShort(profile.updated_at),
    });
  }

  if (profile.status === 'rejected') {
    events.push({
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      label: 'Rejected by PSS',
      description: profile.rejection_reason ?? 'Profile did not meet requirements',
      date: formatDateShort(profile.updated_at),
    });
  }

  if (profile.status === 'resubmit_required') {
    events.push({
      icon: AlertCircle,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
      label: 'Resubmission Required',
      description: profile.rejection_reason ?? 'PSS requires additional information',
      date: formatDateShort(profile.updated_at),
    });
  }

  return events;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const PENDING_STATUSES = ['submitted', 'under_review'];
  const [pollingInterval, setPollingInterval] = useState(8_000);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: profile, isLoading, isError } = useGetProfileQuery(params.id, { pollingInterval });

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
    try {
      await submitProfile(profile._id).unwrap();
    } catch {
      alert('Failed to submit profile. Please try again.');
    }
  }

  async function handleDeleteConfirm() {
    if (!profile) return;
    try {
      await deleteProfile(profile._id).unwrap();
      router.push('/dashboard');
    } catch {
      alert('Failed to delete profile. Please try again.');
      setShowDeleteModal(false);
    }
  }

  // ── Permission flags ───────────────────────────────────────────────────────
  const isPending  = profile?.status === 'submitted' || profile?.status === 'under_review';
  const canEdit    = !isPending && (profile?.status === 'draft' || profile?.status === 'resubmit_required' || profile?.status === 'rejected');
  const canSubmit  = !isPending && (profile?.status === 'draft' || profile?.status === 'resubmit_required' || profile?.status === 'rejected');
  // Allow delete for any status — the confirmation modal guards against accidents
  const canDelete  = !!profile;
  const isResubmit = profile?.status === 'rejected' || profile?.status === 'resubmit_required';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-xl border border-gray-100 bg-white shadow-card p-6 space-y-4">
            <div className="skeleton h-6 w-64" />
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-20 w-full" />
          </div>
          <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white shadow-card p-6 space-y-4">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm font-medium text-red-600">Profile not found.</p>
        <Link href="/dashboard" className="mt-3 inline-block text-sm text-teal-600 hover:underline">
          Back to My Profiles
        </Link>
      </div>
    );
  }

  const timeline = buildTimeline(profile);

  return (
    <>
      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {showDeleteModal && (
        <DeleteModal
          profileName={profile.display_name}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <div className="space-y-5 pb-12">

        {/* ── Page header ───────────────────────────────────────────────────── */}
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

          {/* Header actions */}
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
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Two-column body ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* ══ LEFT: Profile data (3/5) ══════════════════════════════════════ */}
          <div className="lg:col-span-3 space-y-4">

            {/* Status bar */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-card p-5">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
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
            </div>

            {/* Profile details */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-card divide-y divide-gray-50">
              {profile.bio && (
                <div className="p-5">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bio</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}
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
              {!profile.bio && !profile.description && !profile.address && (
                <div className="p-5 text-center text-sm text-gray-400">
                  No profile details added yet.
                </div>
              )}
            </div>

            {/* Identity documents */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-card p-5">
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

            {/* ── Danger Zone ─────────────────────────────────────────────── */}
            {canDelete && (
              <div className="rounded-xl border border-red-100 bg-white shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-red-100 bg-red-50/50">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Danger Zone
                  </h3>
                </div>
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Delete this profile</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Permanently remove this profile and all associated data. This cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Profile
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ══ RIGHT: PSS Verification & History (2/5) ═══════════════════════ */}
          <div className="lg:col-span-2 space-y-4">

            {/* PSS Status card */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-gray-800">PSS Verification</h3>
              </div>

              {/* SQ Level highlight */}
              {profile.sq_level !== null && profile.sq_level !== undefined ? (
                <div className="mb-4 flex items-center gap-3 rounded-lg bg-teal-50 border border-teal-100 px-4 py-3">
                  <Star className="h-5 w-5 text-teal-600 shrink-0" />
                  <div>
                    <p className="text-xs text-teal-600 font-medium">SQ Level Assigned</p>
                    <p className="text-lg font-bold text-teal-700">Level {profile.sq_level}</p>
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                  <Star className="h-5 w-5 text-gray-300 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">SQ Level</p>
                    <p className="text-sm font-medium text-gray-500">Not yet assigned</p>
                  </div>
                </div>
              )}

              {/* PSS Request ID */}
              {profile.pss_request_id && (
                <div className="flex items-start gap-2 mb-4 text-xs text-gray-500">
                  <Hash className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <span className="block text-gray-400">PSS Request ID</span>
                    <span className="font-mono text-gray-600 break-all">{profile.pss_request_id}</span>
                  </div>
                </div>
              )}

              {/* Rejection / resubmit reason */}
              {profile.rejection_reason && (
                <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-orange-700 mb-1">
                    {profile.status === 'rejected' ? 'Rejection Reason' : 'PSS Feedback'}
                  </p>
                  <p className="text-xs text-orange-800 leading-relaxed">{profile.rejection_reason}</p>
                </div>
              )}

              {/* ── Action zone ──────────────────────────────────────────── */}

              {/* PENDING / IN-PROGRESS — locked */}
              {isPending && (
                <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 flex items-start gap-2">
                  <Lock className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-teal-700">
                      {profile.status === 'submitted' ? 'Pending PSS Review' : 'Under Review'}
                    </p>
                    <p className="text-xs text-teal-600 mt-0.5">
                      Your profile is being evaluated by PSS. Editing and re-submission are
                      disabled until a decision is made.
                    </p>
                  </div>
                </div>
              )}

              {/* APPROVED */}
              {profile.status === 'approved' && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700">
                    This profile has been approved by PSS. No further action is required.
                  </p>
                </div>
              )}

              {/* DRAFT — first submission */}
              {profile.status === 'draft' && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Submitting…' : 'Submit for PSS Approval'}
                </button>
              )}

              {/* REJECTED or RESUBMIT_REQUIRED */}
              {canSubmit && isResubmit && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    {profile.status === 'rejected'
                      ? 'You can edit your profile and resubmit it for PSS re-evaluation.'
                      : 'PSS has requested additional information. Update your profile and resubmit.'}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/profiles/${profile._id}/edit`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit First
                    </Link>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      {isSubmitting ? 'Sending…' : 'Resubmit'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PSS History timeline */}
            {timeline.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white shadow-card p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Submission History
                </h3>
                <div>
                  {timeline.map((event, i) => (
                    <TimelineItem key={i} event={event} isLast={i === timeline.length - 1} />
                  ))}
                </div>
              </div>
            )}

            {/* PSS Submitted snapshot */}
            {profile.pss_request_id && (
              <div className="rounded-xl border border-gray-100 bg-white shadow-card p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Submitted Profile Snapshot
                </h3>
                <dl className="space-y-2.5">
                  <div className="flex gap-3">
                    <dt className="text-xs text-gray-400 w-28 shrink-0">Display Name</dt>
                    <dd className="text-xs text-gray-700 font-medium">{profile.display_name}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="text-xs text-gray-400 w-28 shrink-0">Role</dt>
                    <dd className="text-xs text-gray-700">{getRoleLabel(profile.role)}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="text-xs text-gray-400 w-28 shrink-0">Platform</dt>
                    <dd className="text-xs text-gray-700">{getPlatformLabel(profile.platform)}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="text-xs text-gray-400 w-28 shrink-0">CNIC Docs</dt>
                    <dd className="text-xs text-gray-700">
                      {profile.cnic_front && profile.cnic_back ? 'Both uploaded ✓' : 'Incomplete'}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="text-xs text-gray-400 w-28 shrink-0">Last Updated</dt>
                    <dd className="text-xs text-gray-700">{formatDate(profile.updated_at)}</dd>
                  </div>
                </dl>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
