'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useGetCriteriaByPlatformQuery,
  useCreateCriteriaSetMutation,
  useUpdateCriteriaSetMutation,
} from '@/lib/store/api/criteria.api';
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
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { CriteriaSet, Criterion, CheckType, SqLevel } from '@/types/pss.types';
import { SQ_LEVELS } from '@/types/pss.types';
import { Plus, Trash2, Save, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const CHECK_TYPES: { value: CheckType; label: string }[] = [
  { value: 'presence', label: 'Field presence (exists & non-empty)' },
  { value: 'min_length', label: 'Minimum string length' },
  { value: 'min_value', label: 'Minimum numeric value' },
  { value: 'regex', label: 'Regex match' },
];

// ── Criterion row ─────────────────────────────────────────────────────────────

function CriterionRow({
  criterion,
  index,
  onChange,
  onRemove,
}: {
  criterion: Criterion;
  index: number;
  onChange: (updated: Criterion) => void;
  onRemove: () => void;
}) {
  const needsValue = criterion.check_type !== 'presence';

  return (
    <div className="grid grid-cols-12 gap-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 items-start">
      {/* Index */}
      <div className="col-span-1 flex items-center justify-center pt-2">
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{index + 1}</span>
      </div>

      {/* Label */}
      <div className="col-span-3 space-y-1">
        <Label className="text-xs">Label</Label>
        <input
          className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
          placeholder="e.g. Verified email"
          value={criterion.label}
          onChange={(e) => onChange({ ...criterion, label: e.target.value })}
        />
      </div>

      {/* Field key */}
      <div className="col-span-2 space-y-1">
        <Label className="text-xs">Field Key</Label>
        <input
          className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
          placeholder="entity_data.email"
          value={criterion.field_key}
          onChange={(e) => onChange({ ...criterion, field_key: e.target.value })}
        />
      </div>

      {/* Check type */}
      <div className="col-span-2 space-y-1">
        <Label className="text-xs">Check Type</Label>
        <select
          className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
          value={criterion.check_type}
          onChange={(e) =>
            onChange({
              ...criterion,
              check_type: e.target.value as CheckType,
              check_value: e.target.value === 'presence' ? null : criterion.check_value,
            })
          }
        >
          {CHECK_TYPES.map((ct) => (
            <option key={ct.value} value={ct.value}>
              {ct.label}
            </option>
          ))}
        </select>
      </div>

      {/* Check value */}
      <div className="col-span-1 space-y-1">
        <Label className="text-xs">Value</Label>
        <input
          className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none disabled:opacity-40"
          placeholder={
            criterion.check_type === 'min_length'
              ? '3'
              : criterion.check_type === 'min_value'
              ? '18'
              : criterion.check_type === 'regex'
              ? '^[A-Z]'
              : '—'
          }
          disabled={!needsValue}
          value={criterion.check_value ?? ''}
          onChange={(e) => onChange({ ...criterion, check_value: e.target.value || null })}
        />
      </div>

      {/* SQ Min */}
      <div className="col-span-1 space-y-1">
        <Label className="text-xs">SQ Min</Label>
        <select
          className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
          value={criterion.sq_min}
          onChange={(e) => onChange({ ...criterion, sq_min: Number(e.target.value) as SqLevel })}
        >
          {SQ_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              SQ{lvl}
            </option>
          ))}
        </select>
      </div>

      {/* Required */}
      <div className="col-span-1 space-y-1 flex flex-col items-center">
        <Label className="text-xs">Required</Label>
        <input
          type="checkbox"
          className="mt-1.5 h-4 w-4 rounded border-gray-300"
          checked={criterion.required}
          onChange={(e) => onChange({ ...criterion, required: e.target.checked })}
        />
      </div>

      {/* Remove */}
      <div className="col-span-1 flex items-end pb-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
          onClick={onRemove}
          type="button"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Criteria set card ─────────────────────────────────────────────────────────

function CriteriaSetCard({
  criteriaSet,
  platformId,
}: {
  criteriaSet: CriteriaSet;
  platformId: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [criteria, setCriteria] = useState<Criterion[]>(criteriaSet.criteria);
  const [dirty, setDirty] = useState(false);
  const [updateCriteriaSet, { isLoading: saving }] = useUpdateCriteriaSetMutation();

  // Sync if server data changes
  useEffect(() => {
    setCriteria(criteriaSet.criteria);
    setDirty(false);
  }, [criteriaSet]);

  const updateCriterion = (index: number, updated: Criterion) => {
    const next = criteria.map((c, i) => (i === index ? updated : c));
    setCriteria(next);
    setDirty(true);
  };

  const addCriterion = () => {
    const next = [
      ...criteria,
      {
        id: generateId(),
        label: '',
        field_key: '',
        required: true,
        sq_min: 1 as SqLevel,
        check_type: 'presence' as CheckType,
        check_value: null,
      },
    ];
    setCriteria(next);
    setDirty(true);
  };

  const removeCriterion = (index: number) => {
    const next = criteria.filter((_, i) => i !== index);
    setCriteria(next);
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateCriteriaSet({
        criteria_set_id: criteriaSet._id,
        platform_id: platformId,
        body: { criteria },
      }).unwrap();
      toast({ title: 'Criteria set saved' });
      setDirty(false);
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">{criteriaSet.entity_type}</CardTitle>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              criteriaSet.active
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
            )}
          >
            {criteriaSet.active ? 'Active' : 'Inactive'}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{criteria.length} criteria</span>
          {dirty && (
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-2">
          {/* Column headers */}
          {criteria.length > 0 && (
            <div className="grid grid-cols-12 gap-2 px-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Label</div>
              <div className="col-span-2">Field Key</div>
              <div className="col-span-2">Check Type</div>
              <div className="col-span-1">Value</div>
              <div className="col-span-1">SQ Min</div>
              <div className="col-span-1">Req'd</div>
              <div className="col-span-1" />
            </div>
          )}

          {/* Criteria rows */}
          {criteria.map((criterion, index) => (
            <CriterionRow
              key={criterion.id}
              criterion={criterion}
              index={index}
              onChange={(updated) => updateCriterion(index, updated)}
              onRemove={() => removeCriterion(index)}
            />
          ))}

          {criteria.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">No criteria defined yet</p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={addCriterion}
            type="button"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Criterion
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// ── New criteria set form ─────────────────────────────────────────────────────

function NewCriteriaSetForm({
  platformId,
  existingEntityTypes,
  onClose,
}: {
  platformId: string;
  existingEntityTypes: string[];
  onClose: () => void;
}) {
  const [entityType, setEntityType] = useState('');
  const [createCriteriaSet, { isLoading }] = useCreateCriteriaSetMutation();

  const handleCreate = async () => {
    if (!entityType.trim()) return;
    try {
      await createCriteriaSet({
        platform_id: platformId,
        entity_type: entityType.trim(),
        criteria: [],
      }).unwrap();
      toast({ title: 'Criteria set created' });
      onClose();
    } catch {
      toast({ title: 'Create failed', variant: 'destructive' });
    }
  };

  return (
    <Card className="border-dashed border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="new-entity-type" className="text-sm font-medium">
              New Entity Type
            </Label>
            <input
              id="new-entity-type"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. rider, driver, restaurant"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="flex gap-2 pt-5">
            <Button onClick={handleCreate} disabled={!entityType.trim() || isLoading} size="sm">
              {isLoading ? 'Creating…' : 'Create'}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CriteriaPage() {
  const params = useParams<{ platform_id: string }>();
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    params.platform_id ?? '',
  );
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [addingNew, setAddingNew] = useState(false);

  const { data: platforms } = useGetAllPlatformsQuery();
  const { data: criteriaSets, isLoading } = useGetCriteriaByPlatformQuery(
    { platform_id: selectedPlatform },
    { skip: !selectedPlatform },
  );

  const handlePlatformChange = (v: string) => {
    setSelectedPlatform(v);
    setEntityTypeFilter('all');
    router.replace(`/criteria/${v}`);
  };

  const entityTypes = [...new Set(criteriaSets?.map((cs) => cs.entity_type) ?? [])];
  const filtered =
    entityTypeFilter === 'all'
      ? criteriaSets ?? []
      : (criteriaSets ?? []).filter((cs) => cs.entity_type === entityTypeFilter);

  return (
    <div className="space-y-4">
      {/* Platform + entity type selector */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <ListChecks className="h-4 w-4 text-indigo-500 shrink-0" />
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

        {selectedPlatform && entityTypes.length > 0 && (
          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {entityTypes.map((et) => (
                <SelectItem key={et} value={et}>
                  {et}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedPlatform && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => setAddingNew(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Entity Type
          </Button>
        )}
      </div>

      {/* New criteria set form */}
      {addingNew && selectedPlatform && (
        <NewCriteriaSetForm
          platformId={selectedPlatform}
          existingEntityTypes={entityTypes}
          onClose={() => setAddingNew(false)}
        />
      )}

      {/* Content */}
      {!selectedPlatform ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-20 text-center">
          <ListChecks className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Select a platform</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Choose a platform to view and edit its criteria sets
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-20 text-center">
          <ListChecks className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No criteria sets found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Create a new entity type to define SQ criteria
          </p>
          <Button className="mt-4" onClick={() => setAddingNew(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Entity Type
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((cs) => (
            <CriteriaSetCard
              key={cs._id}
              criteriaSet={cs}
              platformId={selectedPlatform}
            />
          ))}
        </div>
      )}
    </div>
  );
}
