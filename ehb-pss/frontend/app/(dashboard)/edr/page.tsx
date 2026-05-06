'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import { useGetEdrQueueQuery } from '@/lib/store/api/edr.api';
import { useGetAllPlatformsQuery } from '@/lib/store/api/platforms.api';
import { DataTable } from '@/components/ui/data-table';
import { SqStatusPill } from '@/components/sq/sq-status-pill';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, cn } from '@/lib/utils';
import type { EdrReview } from '@/types/pss.types';
import { Filter, ExternalLink } from 'lucide-react';

function SourceBadge({ source }: { source: EdrReview['source'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        source === 'franchise_escalation'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          : source === 'override'
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      )}
    >
      {source === 'franchise_escalation'
        ? 'Escalated'
        : source === 'override'
        ? 'Override'
        : 'Rule Engine'}
    </span>
  );
}

function DecisionBadge({ decision }: { decision: EdrReview['decision'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        decision === 'approved'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : decision === 'rejected'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          : decision === 'conditional'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      )}
    >
      {decision.charAt(0).toUpperCase() + decision.slice(1)}
    </span>
  );
}

export default function EdrQueuePage() {
  const router = useRouter();

  const columns: ColumnDef<EdrReview, unknown>[] = [
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
      accessorKey: 'platform_id',
      header: 'Platform',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.platform_id}</span>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => <SourceBadge source={row.original.source} />,
    },
    {
      accessorKey: 'decision',
      header: 'Decision',
      cell: ({ row }) => <DecisionBadge decision={row.original.decision} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-blue-600 hover:text-blue-800"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/edr/${row.original.sq_request_id}`);
          }}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Review
        </Button>
      ),
    },
  ];
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const { data, isLoading, isFetching } = useGetEdrQueueQuery({
    platform_id: platformFilter === 'all' ? undefined : platformFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const { data: platforms } = useGetAllPlatformsQuery();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Decision" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Decisions</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="conditional">Conditional</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {platforms?.map((p) => (
              <SelectItem key={p.platform_id} value={p.platform_id}>
                {p.platform_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => { setStatusFilter('pending'); setPlatformFilter('all'); }}>
          Reset
        </Button>

        {statusFilter === 'pending' && (
          <span className="ml-auto text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900/30 px-3 py-1 rounded-full">
            Franchise escalations shown first
          </span>
        )}
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading || isFetching}
        totalRows={data?.total}
        pagination={pagination}
        onPaginationChange={setPagination}
        manualPagination
        enableGlobalFilter={false}
        emptyMessage="No EDR reviews in queue."
        onRowClick={(row) => router.push(`/edr/${row.sq_request_id}`)}
      />
    </div>
  );
}
