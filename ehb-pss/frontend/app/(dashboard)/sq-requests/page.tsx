'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import { useGetPendingRequestsQuery } from '@/lib/store/api/sq.api';
import { useGetAllPlatformsQuery } from '@/lib/store/api/platforms.api';
import { DataTable } from '@/components/ui/data-table';
import { SqBadge } from '@/components/sq/sq-badge';
import { SqStatusPill } from '@/components/sq/sq-status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import type { SqRequest, SqStatus } from '@/types/pss.types';
import { ExternalLink, Filter } from 'lucide-react';

const SQ_STATUSES: { value: SqStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'pending_franchise', label: 'Franchise Review' },
  { value: 'pending_edr', label: 'EDR Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'rejected', label: 'Rejected' },
];

const columns: ColumnDef<SqRequest, unknown>[] = [
  {
    accessorKey: 'entity_id',
    header: 'Entity ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{row.original.entity_id}</span>
    ),
    size: 180,
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
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.original.platform_id}</span>
    ),
  },
  {
    accessorKey: 'sq_level_calculated',
    header: 'SQ Score',
    cell: ({ row }) => (
      <SqBadge level={row.original.sq_level_calculated} />
    ),
  },
  {
    accessorKey: 'criteria_met',
    header: 'Criteria',
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {row.original.criteria_met}/{row.original.total_criteria}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <SqStatusPill status={row.original.status} />,
  },
  {
    accessorKey: 'submitted_at',
    header: 'Submitted',
    cell: ({ row }) => (
      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(row.original.submitted_at)}</span>
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
      >
        <ExternalLink className="h-3.5 w-3.5 mr-1" />
        View
      </Button>
    ),
    size: 80,
  },
];

export default function SqRequestsPage() {
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const { data, isLoading, isFetching } = useGetPendingRequestsQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    platform_id: platformFilter === 'all' ? undefined : platformFilter,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const { data: platforms } = useGetAllPlatformsQuery();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <Filter className="h-4 w-4 text-gray-400 shrink-0" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {SQ_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStatusFilter('all');
            setPlatformFilter('all');
          }}
        >
          Clear
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading || isFetching}
        totalRows={data?.total}
        pagination={pagination}
        onPaginationChange={setPagination}
        manualPagination
        enableGlobalFilter={false}
        emptyMessage="No SQ requests found."
        onRowClick={(row) => router.push(`/sq-requests/${row.sq_request_id}`)}
      />
    </div>
  );
}
