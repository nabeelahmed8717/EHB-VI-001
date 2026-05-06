'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetRulesByPlatformQuery,
  useCreateRuleMutation,
  useUpdateRuleMutation,
  useDeleteRuleMutation,
  useToggleRuleMutation,
} from '@/lib/store/api/rule-engine.api';
import { useGetAllPlatformsQuery } from '@/lib/store/api/platforms.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type {
  PlatformRule,
  RuleOperator,
  RuleAction,
  SqLevel,
} from '@/types/pss.types';
import { SQ_LEVELS } from '@/types/pss.types';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  ArrowLeft,
  Zap,
  GripVertical,
} from 'lucide-react';

// ── Schema ─────────────────────────────────────────────────────────────────────

const ruleSchema = z
  .object({
    rule_name: z.string().min(2, 'Rule name required'),
    criteria_threshold: z.coerce.number().min(0, 'Must be ≥ 0'),
    operator: z.enum(['gte', 'lte', 'eq', 'between']),
    threshold_max: z.coerce.number().optional().nullable(),
    action: z.enum(['auto_approve', 'franchise', 'edr', 'reject']),
    sq_level_assigned: z.coerce.number().optional().nullable(),
    rejection_reason: z.string().optional().nullable(),
    priority: z.coerce.number().int().min(1, 'Priority must be ≥ 1'),
    active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.operator === 'between' && !data.threshold_max) {
      ctx.addIssue({
        code: 'custom',
        path: ['threshold_max'],
        message: 'Max threshold required for "between" operator',
      });
    }
    if (data.action === 'auto_approve' && !data.sq_level_assigned) {
      ctx.addIssue({
        code: 'custom',
        path: ['sq_level_assigned'],
        message: 'SQ level required for auto-approve',
      });
    }
    if (data.action === 'reject' && !data.rejection_reason?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['rejection_reason'],
        message: 'Rejection reason required for reject action',
      });
    }
  });

type RuleFormValues = z.infer<typeof ruleSchema>;

// ── Action badge ───────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: RuleAction }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        action === 'auto_approve'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : action === 'franchise'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          : action === 'edr'
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      )}
    >
      {action === 'auto_approve'
        ? 'Auto Approve'
        : action === 'franchise'
        ? 'Franchise'
        : action === 'edr'
        ? 'EDR'
        : 'Reject'}
    </span>
  );
}

// ── Operator label ─────────────────────────────────────────────────────────────

function operatorLabel(op: RuleOperator, min: number, max?: number | null) {
  if (op === 'gte') return `≥ ${min}`;
  if (op === 'lte') return `≤ ${min}`;
  if (op === 'eq') return `= ${min}`;
  if (op === 'between') return `${min} – ${max ?? '?'}`;
  return `${min}`;
}

// ── Rule form slide-over ───────────────────────────────────────────────────────

function RuleSlideOver({
  open,
  onClose,
  platformId,
  rule,
}: {
  open: boolean;
  onClose: () => void;
  platformId: string;
  rule: PlatformRule | null;
}) {
  const isEditing = !!rule;
  const [createRule, { isLoading: creating }] = useCreateRuleMutation();
  const [updateRule, { isLoading: updating }] = useUpdateRuleMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: rule
      ? {
          rule_name: rule.rule_name,
          criteria_threshold: rule.criteria_threshold,
          operator: rule.operator,
          threshold_max: rule.threshold_max,
          action: rule.action,
          sq_level_assigned: rule.sq_level_assigned,
          rejection_reason: rule.rejection_reason ?? '',
          priority: rule.priority,
          active: rule.active,
        }
      : {
          rule_name: '',
          criteria_threshold: 0,
          operator: 'gte',
          action: 'franchise',
          priority: 10,
          active: true,
        },
  });

  const operator = watch('operator');
  const action = watch('action');

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: RuleFormValues) => {
    try {
      if (isEditing && rule) {
        await updateRule({
          rule_id: rule._id,
          platform_id: platformId,
          body: values,
        }).unwrap();
        toast({ title: 'Rule updated' });
      } else {
        await createRule({ ...values, platform_id: platformId }).unwrap();
        toast({ title: 'Rule created' });
      }
      handleClose();
    } catch {
      toast({
        title: isEditing ? 'Update failed' : 'Create failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Rule' : 'Add New Rule'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {/* Rule name */}
          <div className="space-y-1.5">
            <Label htmlFor="rule_name">Rule Name</Label>
            <input
              id="rule_name"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. High-score auto-approve"
              {...register('rule_name')}
            />
            {errors.rule_name && (
              <p className="text-xs text-red-500">{errors.rule_name.message}</p>
            )}
          </div>

          {/* Criteria threshold + operator */}
          <div className="space-y-1.5">
            <Label>Criteria Threshold</Label>
            <div className="flex gap-2">
              <select
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={operator}
                onChange={(e) => setValue('operator', e.target.value as RuleOperator)}
              >
                <option value="gte">≥ (at least)</option>
                <option value="lte">≤ (at most)</option>
                <option value="eq">= (exactly)</option>
                <option value="between">between</option>
              </select>
              <input
                type="number"
                className="w-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Min"
                {...register('criteria_threshold')}
              />
              {operator === 'between' && (
                <input
                  type="number"
                  className="w-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Max"
                  {...register('threshold_max')}
                />
              )}
            </div>
            {errors.criteria_threshold && (
              <p className="text-xs text-red-500">{errors.criteria_threshold.message}</p>
            )}
            {errors.threshold_max && (
              <p className="text-xs text-red-500">{errors.threshold_max.message}</p>
            )}
          </div>

          {/* Action */}
          <div className="space-y-1.5">
            <Label>Action</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['auto_approve', 'franchise', 'edr', 'reject'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setValue('action', a)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-left',
                    action === a
                      ? a === 'auto_approve'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : a === 'franchise'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : a === 'edr'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
                  )}
                >
                  {a === 'auto_approve'
                    ? 'Auto Approve'
                    : a === 'franchise'
                    ? 'Send to Franchise'
                    : a === 'edr'
                    ? 'Send to EDR'
                    : 'Auto Reject'}
                </button>
              ))}
            </div>
          </div>

          {/* SQ Level (auto_approve) */}
          {action === 'auto_approve' && (
            <div className="space-y-1.5">
              <Label>SQ Level Assigned</Label>
              <div className="flex flex-wrap gap-2">
                {SQ_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setValue('sq_level_assigned', lvl)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-medium',
                      watch('sq_level_assigned') === lvl
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
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

          {/* Rejection reason (reject) */}
          {action === 'reject' && (
            <div className="space-y-1.5">
              <Label htmlFor="rejection_reason">Rejection Reason</Label>
              <textarea
                id="rejection_reason"
                rows={2}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Reason sent to the platform when auto-rejected…"
                {...register('rejection_reason')}
              />
              {errors.rejection_reason && (
                <p className="text-xs text-red-500">{errors.rejection_reason.message}</p>
              )}
            </div>
          )}

          {/* Priority */}
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority (lower = higher priority)</Label>
            <input
              id="priority"
              type="number"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              {...register('priority')}
            />
            {errors.priority && (
              <p className="text-xs text-red-500">{errors.priority.message}</p>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              id="active"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register('active')}
              defaultChecked={rule?.active ?? true}
            />
            <Label htmlFor="active">Rule is active</Label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || updating}>
              {creating || updating
                ? 'Saving…'
                : isEditing
                ? 'Save Changes'
                : 'Create Rule'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Rule card ──────────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  platformId,
  onEdit,
  onDelete,
}: {
  rule: PlatformRule;
  platformId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [toggle] = useToggleRuleMutation();

  return (
    <div
      className={cn(
        'flex items-start gap-4 rounded-xl border p-4 transition-all',
        rule.active
          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
          : 'border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60',
      )}
    >
      <div className="flex flex-col items-center gap-1 pt-1">
        <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600" />
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500">#{rule.priority}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{rule.rule_name}</span>
          <ActionBadge action={rule.action} />
          {!rule.active && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">disabled</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="font-medium text-gray-700 dark:text-gray-300">Criteria:</span>
            {operatorLabel(rule.operator, rule.criteria_threshold, rule.threshold_max)}
          </span>
          {rule.sq_level_assigned && (
            <span className="flex items-center gap-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">SQ Level:</span>
              SQ{rule.sq_level_assigned}
            </span>
          )}
          {rule.rejection_reason && (
            <span className="max-w-xs truncate">
              <span className="font-medium text-gray-700 dark:text-gray-300">Reason:</span>{' '}
              {rule.rejection_reason}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title={rule.active ? 'Disable rule' : 'Enable rule'}
          onClick={() => toggle({ rule_id: rule._id, platform_id: platformId })}
        >
          {rule.active ? (
            <Power className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <PowerOff className="h-3.5 w-3.5 text-gray-400" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5 text-blue-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RuleEnginePage() {
  const params = useParams<{ platform_id: string }>();
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    params.platform_id ?? '',
  );
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PlatformRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<PlatformRule | null>(null);

  const { data: platforms } = useGetAllPlatformsQuery();
  const { data: rules, isLoading } = useGetRulesByPlatformQuery(selectedPlatform, {
    skip: !selectedPlatform,
  });
  const [deleteRule, { isLoading: deleting }] = useDeleteRuleMutation();

  const sortedRules = [...(rules ?? [])].sort((a, b) => a.priority - b.priority);

  const handlePlatformChange = (v: string) => {
    setSelectedPlatform(v);
    router.replace(`/rule-engine/${v}`);
  };

  const openAdd = () => { setEditingRule(null); setSlideOverOpen(true); };
  const openEdit = (rule: PlatformRule) => { setEditingRule(rule); setSlideOverOpen(true); };

  const handleDelete = async () => {
    if (!deletingRule) return;
    try {
      await deleteRule({ rule_id: deletingRule._id, platform_id: selectedPlatform }).unwrap();
      toast({ title: 'Rule deleted' });
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setDeletingRule(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Platform selector header */}
      <div className="flex items-center gap-3 rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
        <Select value={selectedPlatform} onValueChange={handlePlatformChange}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {platforms?.map((p) => (
              <SelectItem key={p.platform_id} value={p.platform_id}>
                {p.platform_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPlatform && (
          <>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {sortedRules.length} rule{sortedRules.length !== 1 ? 's' : ''} ·{' '}
              {sortedRules.filter((r) => r.active).length} active
            </span>
            <Button size="sm" className="ml-auto" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </>
        )}
      </div>

      {/* Rules list */}
      {!selectedPlatform ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-20 text-center">
          <Zap className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Select a platform</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Choose a platform above to view and manage its rules
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : sortedRules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-20 text-center">
          <Zap className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No rules configured</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add rules to automate SQ request routing
          </p>
          <Button className="mt-4" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add First Rule
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
              Rules are evaluated in priority order (lowest number first). First match wins.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedRules.map((rule) => (
              <RuleCard
                key={rule._id}
                rule={rule}
                platformId={selectedPlatform}
                onEdit={() => openEdit(rule)}
                onDelete={() => setDeletingRule(rule)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Slide-over */}
      <RuleSlideOver
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        platformId={selectedPlatform}
        rule={editingRule}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingRule} onOpenChange={(o) => !o && setDeletingRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingRule?.rule_name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete Rule'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
