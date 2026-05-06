'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetAllFranchisesQuery } from '@/lib/store/api/franchise.api';
import { useGetAllPlatformsQuery } from '@/lib/store/api/platforms.api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Franchise, FranchiseStatus } from '@/types/pss.types';
import { Building2, Filter, MapPin, Globe, Clock, CheckCircle } from 'lucide-react';

function StatusBadge({ status }: { status: FranchiseStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'active'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : status === 'suspended'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function FranchiseCard({
  franchise,
  onClick,
}: {
  franchise: Franchise;
  onClick: () => void;
}) {
  const pendingPercent =
    franchise.total_reviews_assigned > 0
      ? Math.round(
          (franchise.pending_review_count / franchise.total_reviews_assigned) * 100,
        )
      : 0;

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-950 transition-colors">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 font-mono text-sm">
              {franchise._id.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{franchise.platform_id}</p>
          </div>
        </div>
        <StatusBadge status={franchise.status} />
      </div>

      {/* Location info */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <MapPin className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
          <span className="font-medium">{franchise.area}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Globe className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
          <span>{franchise.region}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Pending</p>
          </div>
          <p className="text-xl font-bold text-orange-700 dark:text-orange-400">
            {franchise.pending_review_count}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <CheckCircle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
            {franchise.total_reviews_assigned}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {franchise.total_reviews_assigned > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
            <span>Pending workload</span>
            <span>{pendingPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all',
                pendingPercent > 50
                  ? 'bg-orange-400'
                  : pendingPercent > 25
                  ? 'bg-yellow-400'
                  : 'bg-green-400',
              )}
              style={{ width: `${pendingPercent}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    </div>
  );
}

export default function FranchisePage() {
  const router = useRouter();
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  const { data, isLoading } = useGetAllFranchisesQuery({
    platform_id: platformFilter === 'all' ? undefined : platformFilter,
    page,
    limit: PAGE_SIZE,
  });

  const { data: platforms } = useGetAllPlatformsQuery();

  const franchises = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // client-side status filter
  const filtered =
    statusFilter === 'all'
      ? franchises
      : franchises.filter((f) => f.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <Filter className="h-4 w-4 text-gray-400 shrink-0" />

        <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); setPage(1); }}>
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => { setPlatformFilter('all'); setStatusFilter('all'); setPage(1); }}
        >
          Clear
        </Button>

        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {isLoading ? '…' : `${total} franchise${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-20 text-center">
          <Building2 className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No franchises found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((franchise) => (
            <FranchiseCard
              key={franchise._id}
              franchise={franchise}
              onClick={() => router.push(`/franchise/${franchise._id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
