'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetPlatformByIdQuery,
  useUpdateWebhookMutation,
  useUpdateStatusMutation,
  useRotateKeyMutation,
  useGetWebhookDeliveriesQuery,
  useSendTestPingMutation,
} from '@/lib/store/api/platforms.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { formatDate, cn } from '@/lib/utils';
import type { WebhookDelivery, DeliveryStatus } from '@/types/pss.types';
import {
  ArrowLeft,
  Globe,
  Mail,
  Link2,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Power,
  PowerOff,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

// ── Webhook form schema ────────────────────────────────────────────────────────

const webhookSchema = z.object({
  webhook_url: z.string().url('Must be a valid URL'),
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

// ── Delivery status badge ──────────────────────────────────────────────────────

function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const config = {
    delivered: { icon: CheckCircle2, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400', label: 'Delivered' },
    pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pending' },
    retrying: { icon: RefreshCw, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400', label: 'Retrying' },
    failed: { icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400', label: 'Failed' },
  };

  const { icon: Icon, color, label } = config[status] ?? config.failed;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        color,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ── Delivery row ───────────────────────────────────────────────────────────────

function DeliveryRow({ delivery }: { delivery: WebhookDelivery }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <DeliveryStatusBadge status={delivery.status} />
        <span className="font-mono text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">
          {delivery.sq_request_id}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
          {delivery.attempts} attempt{delivery.attempts !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
          {formatDate(delivery.created_at)}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {delivery.error_message && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-2">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">Error</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 font-mono">{delivery.error_message}</p>
            </div>
          )}
          {delivery.delivered_at && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Delivered at: <span className="font-medium">{formatDate(delivery.delivered_at)}</span>
            </p>
          )}
          <details>
            <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
              Payload
            </summary>
            <pre className="mt-1 rounded bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-40">
              {JSON.stringify(delivery.payload, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PlatformDetailPage() {
  const { platform_id } = useParams<{ platform_id: string }>();
  const router = useRouter();

  const { data: platform, isLoading } = useGetPlatformByIdQuery(platform_id ?? '');
  const { data: deliveries, isLoading: deliveriesLoading } = useGetWebhookDeliveriesQuery(
    { platform_id: platform_id ?? '', limit: 20 },
    { skip: !platform_id },
  );

  const [updateWebhook, { isLoading: updatingWebhook }] = useUpdateWebhookMutation();
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateStatusMutation();
  const [rotateKey, { isLoading: rotatingKey }] = useRotateKeyMutation();
  const [sendTestPing, { isLoading: pinging }] = useSendTestPingMutation();

  const [showKey, setShowKey] = useState(false);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    values: { webhook_url: platform?.webhook_url ?? '' },
  });

  const onWebhookSubmit = async (values: WebhookFormValues) => {
    if (!platform_id) return;
    try {
      await updateWebhook({ platform_id, body: values }).unwrap();
      toast({ title: 'Webhook URL updated' });
      reset({ webhook_url: values.webhook_url });
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const handleRotateKey = async () => {
    if (!platform_id) return;
    try {
      const res = await rotateKey(platform_id).unwrap();
      setNewApiKey(res.api_key);
      setRotateDialogOpen(false);
      toast({ title: 'API key rotated' });
    } catch {
      toast({ title: 'Key rotation failed', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async () => {
    if (!platform || !platform_id) return;
    const newStatus = platform.status === 'active' ? 'suspended' : 'active';
    try {
      await updateStatus({ platform_id, body: { status: newStatus } }).unwrap();
      toast({ title: `Platform ${newStatus}` });
      setSuspendDialogOpen(false);
    } catch {
      toast({ title: 'Status update failed', variant: 'destructive' });
    }
  };

  const handleTestPing = async () => {
    if (!platform_id) return;
    try {
      const res = await sendTestPing(platform_id).unwrap();
      toast({
        title: res.ok ? 'Test ping successful' : 'Test ping failed',
        description: `HTTP ${res.status}`,
        variant: res.ok ? 'default' : 'destructive',
      });
    } catch {
      toast({ title: 'Test ping failed', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Platform not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const maskedKey = platform.api_key
    ? `${platform.api_key.slice(0, 8)}${'•'.repeat(24)}${platform.api_key.slice(-4)}`
    : '—';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{platform.platform_name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{platform.platform_id}</p>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium',
            platform.status === 'active'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : platform.status === 'suspended'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
          )}
        >
          {platform.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Platform info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              Platform Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Platform ID', value: platform.platform_id, mono: true },
              { label: 'Platform Name', value: platform.platform_name },
              { label: 'Contact Email', value: platform.contact_email },
              { label: 'Registered', value: formatDate(platform.created_at) },
              { label: 'Last Updated', value: formatDate(platform.updated_at) },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
                <span className={cn('text-gray-900 dark:text-gray-100', mono && 'font-mono text-xs')}>
                  {value}
                </span>
              </div>
            ))}

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Entity Types
              </p>
              <div className="flex flex-wrap gap-1.5">
                {platform.entity_types.map((et) => (
                  <span
                    key={et}
                    className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300"
                  >
                    {et}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API key management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-600" />
              API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Current API Key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-mono text-amber-400 overflow-hidden">
                  {showKey ? platform.api_key : maskedKey}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={() => setShowKey((s) => !s)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {newApiKey && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 p-3">
                <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-1">New API Key (copy now)</p>
                <code className="block text-xs font-mono text-green-700 dark:text-green-400 break-all">
                  {newApiKey}
                </code>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setRotateDialogOpen(true)}
                disabled={rotatingKey}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Rotate Key
              </Button>
            </div>

            <Separator />

            {/* Status toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Platform Status</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {platform.status === 'active'
                    ? 'Platform is accepting SQ requests'
                    : 'Platform is suspended — no new requests'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  platform.status === 'active'
                    ? 'text-red-600 border-red-200 hover:bg-red-50'
                    : 'text-green-600 border-green-200 hover:bg-green-50',
                )}
                onClick={() => setSuspendDialogOpen(true)}
                disabled={updatingStatus}
              >
                {platform.status === 'active' ? (
                  <>
                    <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                    Suspend
                  </>
                ) : (
                  <>
                    <Power className="h-3.5 w-3.5 mr-1.5" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4 text-indigo-600" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onWebhookSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <input
                id="webhook_url"
                type="url"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('webhook_url')}
              />
              {errors.webhook_url && (
                <p className="text-xs text-red-500">{errors.webhook_url.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={!isDirty || updatingWebhook}
              >
                {updatingWebhook ? 'Saving…' : 'Save Webhook URL'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestPing}
                disabled={pinging}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {pinging ? 'Sending…' : 'Test Ping'}
              </Button>
              <div className="ml-auto text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Deliveries signed with HMAC-SHA256
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Webhook delivery history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            Webhook Delivery History
            <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">(last 20)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {deliveriesLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !deliveries || deliveries.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">No webhook deliveries recorded yet</p>
            </div>
          ) : (
            <div>
              {deliveries.map((delivery) => (
                <DeliveryRow key={delivery._id} delivery={delivery} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rotate key confirmation */}
      <AlertDialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately invalidate the current API key. Any requests from the platform
              using the old key will fail. Make sure to update the platform with the new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleRotateKey}
              disabled={rotatingKey}
            >
              {rotatingKey ? 'Rotating…' : 'Rotate Key'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend / activate confirmation */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {platform.status === 'active' ? 'Suspend Platform?' : 'Activate Platform?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {platform.status === 'active'
                ? `Suspending "${platform.platform_name}" will stop accepting new SQ requests from this platform.`
                : `Reactivating "${platform.platform_name}" will allow it to submit new SQ requests again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                platform.status === 'active'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
              onClick={handleToggleStatus}
              disabled={updatingStatus}
            >
              {updatingStatus
                ? 'Updating…'
                : platform.status === 'active'
                ? 'Suspend'
                : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
