'use client';

import { useState } from 'react';
import { useGetSellerProfileQuery, useSubmitSellerToPssMutation } from '@/lib/store/api/seller.api';
import { getSqStatusConfig } from '@/lib/utils';
import type { SqStatus } from '@/lib/store/api/products.api';
import {
  Shield, CheckCircle, Clock, XCircle, AlertCircle, Send, Loader2,
} from 'lucide-react';

const STEPS = [
  { status: 'not_submitted', label: 'Not submitted', icon: AlertCircle },
  { status: 'pending', label: 'Under review', icon: Clock },
  { status: 'pending_franchise', label: 'Franchise review', icon: Clock },
  { status: 'pending_edr', label: 'EDR verification', icon: Clock },
  { status: 'approved', label: 'Approved', icon: CheckCircle },
];

/** Statuses where the seller is allowed to (re)submit for PSS verification. */
const CAN_SUBMIT_STATUSES = ['not_submitted', 'rejected'];

export default function SellerSqStatusPage() {
  const { data: profile, isLoading } = useGetSellerProfileQuery();
  const [submitToPss, { isLoading: isSubmitting }] = useSubmitSellerToPssMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;
  if (!profile) return <p className="text-muted-foreground text-sm">No seller profile found</p>;

  const sqConfig = getSqStatusConfig(profile.sq_status as SqStatus);
  const isApproved = profile.sq_status === 'approved';
  const isRejected = profile.sq_status === 'rejected';
  const canSubmit = CAN_SUBMIT_STATUSES.includes(profile.sq_status);

  async function handleSubmit() {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await submitToPss().unwrap();
      setSubmitSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to submit verification request. Please try again.';
      setSubmitError(message);
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">Trust Score (SQ)</h1>

      {/* Main badge */}
      <div className="bg-white rounded-2xl border p-6 flex items-center gap-5">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          isApproved ? 'bg-success-100' : isRejected ? 'bg-destructive/10' : 'bg-warning-50'
        }`}>
          <Shield className={`w-8 h-8 ${
            isApproved ? 'text-success-600' : isRejected ? 'text-destructive' : 'text-yellow-500'
          }`} />
        </div>
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sqConfig.color}`}>
            {sqConfig.label}
          </span>
          {profile.sq_level !== null && (
            <p className="text-3xl font-bold text-foreground mt-1">Level {profile.sq_level}</p>
          )}
          {profile.sq_badge_label && (
            <p className="text-sm text-muted-foreground">{profile.sq_badge_label}</p>
          )}
        </div>
      </div>

      {/* Manual PSS verification request — shown only when seller can submit */}
      {canSubmit && (
        <div className="bg-white rounded-2xl border border-dashed border-accent/40 p-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-accent-50 flex items-center justify-center shrink-0 mt-0.5">
              <Send className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {isRejected ? 'Resubmit for PSS Verification' : 'Submit for PSS Verification'}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isRejected
                  ? 'Your previous submission was rejected. Review the reason below, then resubmit when ready.'
                  : 'Your store has not been submitted for verification yet. Send a request to PSS to start the SQ review process.'}
              </p>
            </div>
          </div>

          {isRejected && profile.sq_rejection_reason && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
              <span className="font-semibold">Rejection reason: </span>
              {profile.sq_rejection_reason}
            </div>
          )}

          {submitSuccess && (
            <div className="bg-success-50 border border-success-200 rounded-lg px-4 py-3 text-sm text-success-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Verification request sent successfully. Your status is now <strong>Under review</strong>.
            </div>
          )}

          {submitError && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || submitSuccess}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-accent-foreground text-sm font-semibold px-5 py-2.5 rounded-pill transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isRejected ? 'Resubmit Verification Request' : 'Send Verification Request to PSS'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress timeline */}
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="font-semibold text-foreground mb-4">Verification progress</h2>
        <div className="space-y-3">
          {STEPS.map(({ status, label, icon: Icon }, i) => {
            const currentIdx = STEPS.findIndex((s) => s.status === profile.sq_status);
            const isDone = i < currentIdx || isApproved;
            const isCurrent = i === currentIdx;
            return (
              <div key={status} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone ? 'bg-success-100 text-success-600' :
                  isCurrent ? 'bg-accent-100 text-accent' :
                  'bg-surface-alt text-muted-foreground'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-sm ${isCurrent ? 'font-semibold text-foreground' : isDone ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {isCurrent && (
                  <span className="ml-auto text-xs bg-accent-50 text-accent px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
            );
          })}

          {isRejected && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-destructive">Rejected</span>
                {profile.sq_rejection_reason && (
                  <p className="text-xs text-muted-foreground">{profile.sq_rejection_reason}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Your trust score is managed by PSS (Platform Security System). Contact support if you have questions.
      </p>
    </div>
  );
}
