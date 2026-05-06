'use client';

import { useGetPendingRequestsQuery } from '@/lib/store/api/sq.api';
import { useGetEdrQueueQuery } from '@/lib/store/api/edr.api';
import { useGetAllFranchisesQuery } from '@/lib/store/api/franchise.api';
import { useGetAllPlatformsQuery } from '@/lib/store/api/platforms.api';
import { useSearchLogsQuery } from '@/lib/store/api/audit.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditActionBadge } from '@/components/audit/audit-action-badge';
import { SqStatusPill } from '@/components/sq/sq-status-pill';
import { formatDate } from '@/lib/utils';
import {
  FileSearch,
  Shield,
  Building2,
  Globe,
  TrendingUp,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  color,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  href: string;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
              )}
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function OverviewPage() {
  const { data: sqData, isLoading: sqLoading } = useGetPendingRequestsQuery({
    status: 'pending',
    page: 1,
    limit: 1,
  });

  const { data: edrData, isLoading: edrLoading } = useGetEdrQueueQuery({
    status: 'pending',
    page: 1,
    limit: 1,
  });

  const { data: franchiseData, isLoading: franchiseLoading } = useGetAllFranchisesQuery({
    page: 1,
    limit: 1,
  });

  const { data: platforms, isLoading: platformsLoading } = useGetAllPlatformsQuery();

  const { data: auditData, isLoading: auditLoading } = useSearchLogsQuery({
    page: 1,
    limit: 10,
  });

  // Sum pending franchise reviews across all franchises
  const franchiseData2 = useGetAllFranchisesQuery({ page: 1, limit: 50 });
  const pendingFranchiseReviews =
    franchiseData2.data?.data?.reduce(
      (sum, f) => sum + (f.pending_review_count ?? 0),
      0,
    ) ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending SQ Requests"
          value={sqData?.total ?? 0}
          icon={FileSearch}
          href="/sq-requests"
          color="bg-blue-600"
          isLoading={sqLoading}
        />
        <StatCard
          title="Pending EDR Reviews"
          value={edrData?.total ?? 0}
          icon={Shield}
          href="/edr"
          color="bg-red-500"
          isLoading={edrLoading}
        />
        <StatCard
          title="Pending Franchise Reviews"
          value={franchiseLoading ? '…' : pendingFranchiseReviews}
          icon={Building2}
          href="/franchise"
          color="bg-orange-500"
          isLoading={franchiseLoading}
        />
        <StatCard
          title="Registered Platforms"
          value={platforms?.length ?? 0}
          icon={Globe}
          href="/platforms"
          color="bg-green-600"
          isLoading={platformsLoading}
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent audit activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                Recent Audit Activity
              </CardTitle>
              <Link href="/audit" className="text-xs text-blue-600 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : auditData?.data?.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {auditData?.data?.slice(0, 10).map((log) => (
                    <div
                      key={log._id}
                      className="flex items-start gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <AuditActionBadge action={log.action} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{log.reason}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {log.entity_id} · {log.platform_id} · {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick stats panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                Active Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              {platformsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {platforms
                    ?.filter((p) => p.status === 'active')
                    .slice(0, 6)
                    .map((platform) => (
                      <Link
                        key={platform.platform_id}
                        href={`/platforms/${platform.platform_id}`}
                        className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {platform.platform_name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{platform.platform_id}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 text-xs font-medium">
                          Active
                        </span>
                      </Link>
                    ))}
                  {(platforms?.filter((p) => p.status === 'active').length ?? 0) === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                      No active platforms
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Recent SQ Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {sqLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-2">
                  {sqData?.data?.slice(0, 5).map((req) => (
                    <Link
                      key={req._id}
                      href={`/sq-requests/${req.sq_request_id}`}
                      className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                          {req.entity_id}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{req.entity_type}</p>
                      </div>
                      <SqStatusPill status={req.status} />
                    </Link>
                  ))}
                  {(sqData?.data?.length ?? 0) === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No pending requests</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
