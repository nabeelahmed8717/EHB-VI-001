'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetRequestByIdQuery } from '@/lib/store/api/sq.api';
import { useGetLogsByRequestQuery } from '@/lib/store/api/audit.api';
import { SqBadge } from '@/components/sq/sq-badge';
import { SqStatusPill } from '@/components/sq/sq-status-pill';
import { AuditActionBadge } from '@/components/audit/audit-action-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatDate, flattenObject } from '@/lib/utils';
import { ArrowLeft, Shield, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function SqRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: request, isLoading } = useGetRequestByIdQuery(id ?? '');
  const { data: auditLogs, isLoading: auditLoading } = useGetLogsByRequestQuery(id ?? '');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">SQ request not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const criteriaPercent =
    request.total_criteria > 0
      ? Math.round((request.criteria_met / request.total_criteria) * 100)
      : 0;

  const entityFields = request.entity_data ? flattenObject(request.entity_data) : [];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-mono">{request.sq_request_id}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {request.entity_type} · {request.platform_id}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SqStatusPill status={request.status} />
          <SqBadge level={request.sq_level_calculated} size="lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Request details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Entity ID', value: request.entity_id },
              { label: 'Entity Type', value: request.entity_type },
              { label: 'User ID', value: request.user_id },
              { label: 'Platform', value: request.platform_id },
              { label: 'Status', value: <SqStatusPill status={request.status} /> },
              { label: 'Submitted', value: formatDate(request.submitted_at) },
              {
                label: 'Decided',
                value: request.decided_at ? formatDate(request.decided_at) : '—',
              },
              {
                label: 'Assigned Franchise',
                value: request.assigned_franchise_id ?? '—',
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
                <span className="text-gray-900 dark:text-gray-100 text-right max-w-[60%] break-all">
                  {value}
                </span>
              </div>
            ))}

            {request.rejection_reason && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">Rejection Reason</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{request.rejection_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SQ Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SQ Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Criteria Met</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {request.criteria_met}
                  <span className="text-lg text-gray-400 dark:text-gray-500">/{request.total_criteria}</span>
                </p>
              </div>
              <SqBadge level={request.sq_level_calculated} size="lg" />
            </div>
            <Progress value={criteriaPercent} className="h-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{criteriaPercent}% criteria satisfied</p>

            {/* Action buttons based on status */}
            {request.status === 'pending_edr' && (
              <Link href={`/edr/${request.sq_request_id}`}>
                <Button className="w-full" variant="default">
                  <Shield className="h-4 w-4 mr-2" />
                  Open in EDR
                </Button>
              </Link>
            )}
            {request.status === 'pending_franchise' && request.assigned_franchise_id && (
              <Link href={`/franchise/${request.assigned_franchise_id}`}>
                <Button className="w-full" variant="outline">
                  <Building2 className="h-4 w-4 mr-2" />
                  View Franchise
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entity Data */}
      {entityFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entity Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {entityFields.map(({ key, value }) => (
                <div key={key} className="flex flex-col rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {key}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 mt-0.5 break-all">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No audit events recorded</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-4">
                {auditLogs.map((log, i) => (
                  <div key={log._id} className="flex gap-4 pl-10 relative">
                    <div className="absolute left-3.5 top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-900" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <AuditActionBadge action={log.action} />
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{log.reason}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        by {log.performed_by}
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
                            Metadata
                          </summary>
                          <pre className="mt-1 rounded bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-600 dark:text-gray-300 overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    {i < auditLogs.length - 1 && <Separator className="absolute bottom-0 left-10 right-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
