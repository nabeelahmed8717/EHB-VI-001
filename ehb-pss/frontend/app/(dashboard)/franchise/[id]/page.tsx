'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetFranchiseByIdQuery,
  useGetFranchiseQueueQuery,
  useSubmitFranchiseDecisionMutation,
} from '@/lib/store/api/franchise.api';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { SqBadge } from '@/components/sq/sq-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { formatDate, cn } from '@/lib/utils';
import type { FranchiseReview, SqLevel } from '@/types/pss.types';
import { SQ_LEVELS } from '@/types/pss.types';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  CheckCircle,
  Clock,
  Shield,
  X,
  ArrowUpRight,
} from 'lucide-react';

// ── Decision form schema ───────────────────────────────────────────────────────

const decisionSchema = z
  .object({
    decision: z.enum(['approve', 'reject', 'escalate']),
    sq_level_assigned: z.number().optional(),
    rejection_reason: z.string().optional(),
    reviewed_by: z.string().min(2, 'Reviewer name required'),
  })
  .superRefine((data, ctx) => {
    if (data.decision === 'approve' && !data.sq_level_assigned) {
      ctx.addIssue({
        code: 'custom',
        path: ['sq_level_assigned'],
        message: 'SQ level required when approving',
      });
    }
    if (data.decision === 'reject' && !data.rejection_reason?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['rejection_reason'],
        message: 'Rejection reason required',
      });
    }
  });

type DecisionFormValues = z.infer<typeof decisionSchema>;

// ── Status pill ────────────────────────────────────────────────────────────────

function ReviewStatusPill({ status }: { status: FranchiseReview['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'pending'
          ? 'bg-yellow-100 text-yellow-700'
          : status === 'decided'
          ? 'bg-green-100 text-green-700'
          : 'bg-orange-100 text-orange-700',
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Decision modal ─────────────────────────────────────────────────────────────

function DecisionModal({
  review,
  open,
  onClose,
}: {
  review: FranchiseReview | null;
  open: boolean;
  onClose: () => void;
}) {
  const [submitDecision, { isLoading }] = useSubmitFranchiseDecisionMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { decision: 'approve', reviewed_by: '' },
  });

  const decision = watch('decision');

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: DecisionFormValues) => {
    if (!review) return;
    try {
      await submitDecision({
        sq_request_id: review.sq_request_id,
        body: {
          decision: values.decision,
          sq_level_assigned: values.sq_level_assigned as SqLevel | undefined,
          rejection_reason: values.rejection_reason,
          reviewed_by: values.reviewed_by,
        },
      }).unwrap();
      toast({
        title: 'Decision submitted',
        description: `Review marked as ${values.decision}`,
      });
      handleClose();
    } catch {
      toast({
        title: 'Submission failed',
        description: 'Could not submit decision. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Franchise Decision</DialogTitle>
        </DialogHeader>

        {review && (
          <div className="mb-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-xs text-gray-600 dark:text-gray-300 font-mono">
            {review.sq_request_id} · {review.entity_type}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Decision choice */}
          <div className="space-y-1.5">
            <Label>Decision</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['approve', 'reject', 'escalate'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setValue('decision', d)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    decision === d
                      ? d === 'approve'
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300'
                        : d === 'reject'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                        : 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
                  )}
                >
                  {d === 'approve' ? 'Approve' : d === 'reject' ? 'Reject' : 'Escalate'}
                </button>
              ))}
            </div>
            {errors.decision && (
              <p className="text-xs text-red-500">{errors.decision.message}</p>
            )}
          </div>

          {/* SQ Level (approve) */}
          {decision === 'approve' && (
            <div className="space-y-1.5">
              <Label>SQ Level Assigned</Label>
              <div className="flex flex-wrap gap-2">
                {SQ_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setValue('sq_level_assigned', lvl)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                      watch('sq_level_assigned') === lvl
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
                    )}
                  >
                    SQ{lvl}
                  </button>
                ))}
              </div>
              {errors.sq_level_assigned && (
                <p className="text-xs text-red-500">{errors.sq_level_assigned.message}</p>
              )}
            </div>
          )}

          {/* Rejection reason */}
          {decision === 'reject' && (
            <div className="space-y-1.5">
              <Label htmlFor="rejection_reason">Rejection Reason</Label>
              <textarea
                id="rejection_reason"
                rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Explain the reason for rejection…"
                {...register('rejection_reason')}
              />
              {errors.rejection_reason && (
                <p className="text-xs text-red-500">{errors.rejection_reason.message}</p>
              )}
            </div>
          )}

          {/* Escalate note */}
          {decision === 'escalate' && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 p-3">
              <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">
                This review will be escalated to the EDR team for further assessment.
              </p>
            </div>
          )}

          {/* Reviewed by */}
          <div className="space-y-1.5">
            <Label htmlFor="reviewed_by">Reviewed By</Label>
            <input
              id="reviewed_by"
              type="text"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Your name / employee ID"
              {...register('reviewed_by')}
            />
            {errors.reviewed_by && (
              <p className="text-xs text-red-500">{errors.reviewed_by.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                decision === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : decision === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700',
              )}
            >
              {isLoading ? 'Submitting…' : 'Submit Decision'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FranchiseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [selectedReview, setSelectedReview] = useState<FranchiseReview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: franchise, isLoading: franchiseLoading } = useGetFranchiseByIdQuery(
    id ?? '',
  );
  const { data: queue, isLoading: queueLoading } = useGetFranchiseQueueQuery(id ?? '');

  const openModal = (review: FranchiseReview) => {
    setSelectedReview(review);
    setModalOpen(true);
  };

  const columns: ColumnDef<FranchiseReview, unknown>[] = [
    {
      accessorKey: 'entity_id',
      header: 'Entity ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{row.original.entity_id}</span>
      ),
    },
    {
      accessorKey: 'entity_type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
          {row.original.entity_type}
        </span>
      ),
    },
    {
      accessorKey: 'sq_request_id',
      header: 'SQ Request',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-500">
          {row.original.sq_request_id.slice(-10)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <ReviewStatusPill status={row.original.status} />,
    },
    {
      accessorKey: 'sq_level_assigned',
      header: 'SQ Level',
      cell: ({ row }) =>
        row.original.sq_level_assigned ? (
          <SqBadge level={row.original.sq_level_assigned} />
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      accessorKey: 'created_at',
      header: 'Assigned',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.status === 'pending' && (
            <Button
              variant="default"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                openModal(row.original);
              }}
            >
              Decide
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-blue-600 hover:text-blue-800"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/sq-requests/${row.original.sq_request_id}`);
            }}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (franchiseLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Franchise not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const pending = queue?.filter((r) => r.status === 'pending') ?? [];
  const decided = queue?.filter((r) => r.status !== 'pending') ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {franchise.area} — {franchise.region}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{franchise._id}</p>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium',
            franchise.status === 'active'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : franchise.status === 'suspended'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
          )}
        >
          {franchise.status}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Platform</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {franchise.platform_id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/50">
                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Area / Region</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {franchise.area} / {franchise.region}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/50">
                <Clock className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending Reviews</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {franchise.pending_review_count}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/50">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Assigned</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {franchise.total_reviews_assigned}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending review queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Pending Reviews
            {pending.length > 0 && (
              <span className="rounded-full bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300">
                {pending.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={pending}
            columns={columns}
            isLoading={queueLoading}
            enableGlobalFilter={false}
            emptyMessage="No pending reviews in this franchise queue."
          />
        </CardContent>
      </Card>

      {/* Decided reviews */}
      {decided.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gray-400" />
              Decided / Escalated
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                {decided.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={decided}
              columns={columns}
              isLoading={queueLoading}
              enableGlobalFilter={false}
              emptyMessage="No decided reviews."
            />
          </CardContent>
        </Card>
      )}

      {/* Decision modal */}
      <DecisionModal
        review={selectedReview}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedReview(null); }}
      />
    </div>
  );
}
