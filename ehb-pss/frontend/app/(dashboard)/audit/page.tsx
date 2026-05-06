'use client';

import { useState } from 'react';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import { useSearchLogsQuery } from '@/lib/store/api/audit.api';
import { useGetAllPlatformsQuery } from '@/lib/store/api/platforms.api';
import { DataTable } from '@/components/ui/data-table';
import { AuditActionBadge } from '@/components/audit/audit-action-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import type { AuditLog } from '@/types/pss.types';
import { AUDIT_ACTIONS } from '@/types/pss.types';
import { Filter, Search, Download, X } from 'lucide-react';

// ── Columns ────────────────────────────────────────────────────────────────────

const columns: ColumnDef<AuditLog, unknown>[] = [
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => <AuditActionBadge action={row.original.action} />,
    size: 180,
  },
  {
    accessorKey: 'entity_id',
    header: 'Entity ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{row.original.entity_id}</span>
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
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{row.original.platform_id}</span>
    ),
  },
  {
    accessorKey: 'performed_by',
    header: 'Performed By',
    cell: ({ row }) => (
      <span className="text-xs text-gray-500 dark:text-gray-400">{row.original.performed_by}</span>
    ),
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) => (
      <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 max-w-xs">
        {row.original.reason}
      </span>
    ),
  },
  {
    id: 'metadata',
    header: 'Metadata',
    cell: ({ row }) =>
      row.original.metadata && Object.keys(row.original.metadata).length > 0 ? (
        <details className="text-xs">
          <summary className="cursor-pointer text-blue-500 hover:text-blue-700 select-none">
            View
          </summary>
          <pre className="absolute z-10 mt-1 max-w-xs rounded-lg bg-gray-900 p-2 text-xs text-green-400 overflow-auto max-h-40 shadow-lg">
            {JSON.stringify(row.original.metadata, null, 2)}
          </pre>
        </details>
      ) : (
        <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
      ),
  },
  {
    accessorKey: 'created_at',
    header: 'Timestamp',
    cell: ({ row }) => (
      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
        {formatDate(row.original.created_at)}
      </span>
    ),
  },
];

// ── CSV export ─────────────────────────────────────────────────────────────────

function exportToCsv(logs: AuditLog[]) {
  const headers = [
    'action',
    'entity_id',
    'entity_type',
    'platform_id',
    'performed_by',
    'reason',
    'sq_request_id',
    'created_at',
  ];

  const rows = logs.map((log) =>
    headers.map((h) => {
      const val = (log as Record<string, unknown>)[h];
      const str = val == null ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(','),
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pss-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const [actionFilter, setActionFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [performedBy, setPerformedBy] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const { data, isLoading, isFetching } = useSearchLogsQuery({
    action: actionFilter === 'all' ? undefined : actionFilter,
    platform_id: platformFilter === 'all' ? undefined : platformFilter,
    performed_by: performedBy || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const { data: platforms } = useGetAllPlatformsQuery();

  const hasFilters =
    actionFilter !== 'all' ||
    platformFilter !== 'all' ||
    performedBy ||
    fromDate ||
    toDate;

  const clearFilters = () => {
    setActionFilter('all');
    setPlatformFilter('all');
    setPerformedBy('');
    setFromDate('');
    setToDate('');
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 px-2 text-xs text-gray-500 dark:text-gray-400"
              onClick={clearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Action */}
          <Select
            value={actionFilter}
            onValueChange={(v) => { setActionFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Actions</SelectItem>
              {AUDIT_ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Platform */}
          <Select
            value={platformFilter}
            onValueChange={(v) => { setPlatformFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Platforms" />
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

          {/* Performed by */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pl-8 pr-3 py-2 text-sm w-44 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Performed by…"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              title="From date"
            />
            <span className="text-gray-400 text-sm">→</span>
            <input
              type="date"
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              title="To date"
            />
          </div>

          {/* Export */}
          {data?.data && data.data.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => exportToCsv(data.data)}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Result count */}
        {!isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span>
              {data?.total ?? 0} log{(data?.total ?? 0) !== 1 ? 's' : ''} found
            </span>
            {isFetching && (
              <span className="text-blue-400">Refreshing…</span>
            )}
          </div>
        )}
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
        emptyMessage={
          hasFilters
            ? 'No audit logs match the current filters.'
            : 'No audit logs recorded yet.'
        }
      />
    </div>
  );
}
