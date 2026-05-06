'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetEdrReviewDetailQuery,
  useSubmitEdrDecisionMutation,
  useSubmitEdrOverrideMutation,
  useEditEdrRequestMutation,
} from '@/lib/store/api/edr.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SqBadge } from '@/components/sq/sq-badge';
import { SqStatusPill } from '@/components/sq/sq-status-pill';
import { AuditActionBadge } from '@/components/audit/audit-action-badge';
import { toast } from '@/components/ui/toaster';
import { formatDate, flattenObject } from '@/lib/utils';
import type { SqLevel } from '@/types/pss.types';
import { ArrowLeft, Edit3, RotateCcw, Loader2 } from 'lucide-react';

// ── Form schemas ──────────────────────────────────────────────────────────────

const decisionSchema = z
  .object({
    decision: z.enum(['approved', 'conditional', 'rejected']),
    sq_level_assigned: z.coerce.number().optional(),
    rejection_reason: z.string().optional(),
    reviewed_by: z.string().min(1, 'Reviewer name required'),
  })
  .superRefine((data, ctx) => {
    if (
      (data.decision === 'approved' || data.decision === 'conditional') &&
      !data.sq_level_assigned
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SQ level required for approval',
        path: ['sq_level_assigned'],
      });
    }
    if (data.decision === 'rejected' && !data.rejection_reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rejection reason required',
        path: ['rejection_reason'],
      });
    }
  });

const overrideSchema = z.object({
  decision: z.enum(['approved', 'conditional', 'rejected']),
  sq_level_assigned: z.coerce.number().optional(),
  rejection_reason: z.string().optional(),
  reviewed_by: z.string().min(1, 'Reviewer name required'),
  override_notes: z.string().min(3, 'Override notes required'),
});

type DecisionForm = z.infer<typeof decisionSchema>;
type OverrideForm = z.infer<typeof overrideSchema>;

const SQ_LEVELS: SqLevel[] = [1, 2, 3, 5, 7, 10];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EdrReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mode, setMode] = useState<'decide' | 'override' | 'edit'>('decide');
  const [editData, setEditData] = useState<string>('');

  const { data: detail, isLoading } = useGetEdrReviewDetailQuery(id ?? '');
  const [submitDecision, { isLoading: decidingLoading }] = useSubmitEdrDecisionMutation();
  const [submitOverride, { isLoading: overrideLoading }] = useSubmitEdrOverrideMutation();
  const [editRequest, { isLoading: editLoading }] = useEditEdrRequestMutation();

  const decisionForm = useForm<DecisionForm>({ resolver: zodResolver(decisionSchema) });
  const overrideForm = useForm<OverrideForm>({ resolver: zodResolver(overrideSchema) });

  const watchedDecision = decisionForm.watch('decision');
  const watchedOverrideDecision = overrideForm.watch('decision');

  const onDecide = async (data: DecisionForm) => {
    try {
      await submitDecision({
        sq_request_id: id ?? '',
        body: {
          decision: data.decision,
          sq_level_assigned: data.sq_level_assigned as SqLevel | undefined,
          rejection_reason: data.rejection_reason,
          reviewed_by: data.reviewed_by,
        },
      }).unwrap();
      toast({ title: 'Decision submitted', description: `EDR decision: ${data.decision}` });
      router.push('/edr');
    } catch {
      toast({ title: 'Failed', description: 'Could not submit decision.', variant: 'destructive' });
    }
  };

  const onOverride = async (data: OverrideForm) => {
    try {
      await submitOverride({
        sq_request_id: id ?? '',
        body: {
          decision: data.decision,
          sq_level_assigned: data.sq_level_assigned as SqLevel | undefined,
          rejection_reason: data.rejection_reason,
          reviewed_by: data.reviewed_by,
          override_notes: data.override_notes,
        },
      }).unwrap();
      toast({ title: 'Override submitted', description: 'EDR override recorded.' });
      router.push('/edr');
    } catch {
      toast({ title: 'Failed', description: 'Could not submit override.', variant: 'destructive' });
    }
  };

  const onSaveEdit = async () => {
    try {
      const parsed = JSON.parse(editData) as Record<string, unknown>;
      await editRequest({
        sq_request_id: id ?? '',
        body: { entity_data: parsed, edited_by: 'edr_admin' },
      }).unwrap();
      toast({ title: 'Entity data updated', description: 'Changes saved.' });
      setMode('decide');
    } catch {
      toast({ title: 'Failed', description: 'Invalid JSON or save error.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">EDR review not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Back</Button>
      </div>
    );
  }

  const { sq_request, sq_record, franchise_review, edr_reviews, audit_trail } = detail;
  const criteriaPercent = sq_request.total_criteria > 0
    ? Math.round((sq_request.criteria_met / sq_request.total_criteria) * 100)
    : 0;

  const entityFields = sq_request.entity_data ? flattenObject(sq_request.entity_data) : [];
  const latestEdr = edr_reviews.find((r) => r.decision === 'pending') ?? edr_reviews[0];
  const isPreviouslyDecided = sq_record !== null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />Back
        </Button>
        <div>
          <h2 className="text-base font-semibold font-mono">{sq_request.sq_request_id}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{sq_request.entity_type} · {sq_request.platform_id}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SqStatusPill status={sq_request.status} />
          <SqBadge level={sq_request.sq_level_calculated} />
          {isPreviouslyDecided && (
            <Button variant="outline" size="sm" onClick={() => setMode('override')}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />Override
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: full detail */}
        <div className="col-span-2 space-y-4">
          {/* Franchise summary if escalated */}
          {franchise_review && (
            <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-orange-800 dark:text-orange-300">Franchise Review Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                <p>Decision: <strong>{franchise_review.decision ?? 'Escalated'}</strong></p>
                {franchise_review.rejection_reason && (
                  <p>Reason: {franchise_review.rejection_reason}</p>
                )}
                <p>Reviewed by: {franchise_review.reviewed_by ?? '—'} on {formatDate(franchise_review.reviewed_at)}</p>
              </CardContent>
            </Card>
          )}

          {/* Entity data */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Entity Data</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditData(JSON.stringify(sq_request.entity_data, null, 2));
                  setMode(mode === 'edit' ? 'decide' : 'edit');
                }}
              >
                <Edit3 className="h-3.5 w-3.5 mr-1" />
                {mode === 'edit' ? 'Cancel Edit' : 'Edit Data'}
              </Button>
            </CardHeader>
            <CardContent>
              {mode === 'edit' ? (
                <div className="space-y-3">
                  <Textarea
                    className="font-mono text-xs min-h-[200px]"
                    value={editData}
                    onChange={(e) => setEditData(e.target.value)}
                  />
                  <Button size="sm" onClick={onSaveEdit} disabled={editLoading}>
                    {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Save Changes
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {entityFields.map(({ key, value }) => (
                    <div key={key} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{key}</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5 break-all">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">SQ Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {sq_request.criteria_met}/{sq_request.total_criteria} criteria met
                </span>
                <SqBadge level={sq_request.sq_level_calculated} />
              </div>
              <Progress value={criteriaPercent} className="h-2" />
            </CardContent>
          </Card>

          {/* Audit trail */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {audit_trail?.map((log) => (
                  <div key={log._id} className="flex items-start gap-2">
                    <AuditActionBadge action={log.action} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{log.reason}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(log.created_at)}</p>
                    </div>
                  </div>
                ))}
                {(!audit_trail || audit_trail.length === 0) && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No audit events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: decision panel */}
        <div className="space-y-4">
          {mode === 'override' ? (
            <Card className="border-purple-200 dark:border-purple-900/50">
              <CardHeader>
                <CardTitle className="text-base text-purple-800 dark:text-purple-300">EDR Override</CardTitle>
                <p className="text-xs text-purple-600 dark:text-purple-400">Override a previous decision</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={overrideForm.handleSubmit(onOverride)} className="space-y-4">
                  {/* Decision */}
                  <div className="space-y-1">
                    <Label>Decision</Label>
                    <Select onValueChange={(v) => overrideForm.setValue('decision', v as DecisionForm['decision'])}>
                      <SelectTrigger><SelectValue placeholder="Select decision" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="conditional">Conditional</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(watchedOverrideDecision === 'approved' || watchedOverrideDecision === 'conditional') && (
                    <div className="space-y-1">
                      <Label>SQ Level</Label>
                      <Select onValueChange={(v) => overrideForm.setValue('sq_level_assigned', Number(v) as SqLevel)}>
                        <SelectTrigger><SelectValue placeholder="Select SQ level" /></SelectTrigger>
                        <SelectContent>
                          {SQ_LEVELS.map((l) => (
                            <SelectItem key={l} value={String(l)}>SQ{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {watchedOverrideDecision === 'rejected' && (
                    <div className="space-y-1">
                      <Label>Rejection Reason</Label>
                      <Textarea {...overrideForm.register('rejection_reason')} rows={3} />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label>Override Notes *</Label>
                    <Textarea {...overrideForm.register('override_notes')} placeholder="Reason for overriding..." rows={3} />
                    {overrideForm.formState.errors.override_notes && (
                      <p className="text-xs text-destructive">{overrideForm.formState.errors.override_notes.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Reviewed By</Label>
                    <Input {...overrideForm.register('reviewed_by')} placeholder="edr_admin" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setMode('decide')}>Cancel</Button>
                    <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={overrideLoading}>
                      {overrideLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Submit Override
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">EDR Decision</CardTitle>
                {latestEdr && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Source: {latestEdr.source === 'franchise_escalation' ? 'Franchise escalation' : 'Rule engine'}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={decisionForm.handleSubmit(onDecide)} className="space-y-4">
                  {/* Decision radio */}
                  <div className="space-y-1">
                    <Label>Decision *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['approved', 'conditional', 'rejected'] as const).map((d) => (
                        <label
                          key={d}
                          className={`flex flex-col items-center rounded-lg border p-3 cursor-pointer text-xs font-medium transition-colors ${
                            watchedDecision === d ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            value={d}
                            {...decisionForm.register('decision')}
                          />
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </label>
                      ))}
                    </div>
                    {decisionForm.formState.errors.decision && (
                      <p className="text-xs text-destructive">{decisionForm.formState.errors.decision.message}</p>
                    )}
                  </div>

                  {/* SQ Level */}
                  {(watchedDecision === 'approved' || watchedDecision === 'conditional') && (
                    <div className="space-y-1">
                      <Label>SQ Level Assigned *</Label>
                      <Select onValueChange={(v) => decisionForm.setValue('sq_level_assigned', Number(v) as SqLevel)}>
                        <SelectTrigger><SelectValue placeholder="Select SQ level" /></SelectTrigger>
                        <SelectContent>
                          {SQ_LEVELS.map((l) => (
                            <SelectItem key={l} value={String(l)}>SQ{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {decisionForm.formState.errors.sq_level_assigned && (
                        <p className="text-xs text-destructive">{decisionForm.formState.errors.sq_level_assigned.message}</p>
                      )}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {watchedDecision === 'rejected' && (
                    <div className="space-y-1">
                      <Label>Rejection Reason *</Label>
                      <Textarea
                        {...decisionForm.register('rejection_reason')}
                        placeholder="Reason for rejection..."
                        rows={3}
                      />
                      {decisionForm.formState.errors.rejection_reason && (
                        <p className="text-xs text-destructive">{decisionForm.formState.errors.rejection_reason.message}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label>Reviewed By *</Label>
                    <Input {...decisionForm.register('reviewed_by')} placeholder="edr_admin_name" />
                    {decisionForm.formState.errors.reviewed_by && (
                      <p className="text-xs text-destructive">{decisionForm.formState.errors.reviewed_by.message}</p>
                    )}
                  </div>

                  <Separator />

                  <Button type="submit" className="w-full" disabled={decidingLoading}>
                    {decidingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Submit Decision
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Previous EDR reviews */}
          {edr_reviews.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">EDR History ({edr_reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {edr_reviews.map((rev) => (
                  <div key={rev._id} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize text-gray-900 dark:text-gray-100">{rev.decision}</span>
                      <span className="text-gray-400 dark:text-gray-500">{rev.source}</span>
                    </div>
                    {rev.reviewed_by && <p className="text-gray-500 dark:text-gray-400">by {rev.reviewed_by}</p>}
                    {rev.override_notes && (
                      <p className="text-purple-600 italic">{rev.override_notes}</p>
                    )}
                    <p className="text-gray-400 dark:text-gray-500">{formatDate(rev.reviewed_at ?? rev.created_at)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
