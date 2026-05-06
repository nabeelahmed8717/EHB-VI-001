'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type ColumnDef } from '@tanstack/react-table';
import {
  useGetAllPlatformsQuery,
  useRegisterPlatformMutation,
} from '@/lib/store/api/platforms.api';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';
import { formatDate, cn } from '@/lib/utils';
import type { Platform, PlatformStatus } from '@/types/pss.types';
import { Globe, Plus, ExternalLink, Copy, Check } from 'lucide-react';

// ── Status badge ───────────────────────────────────────────────────────────────

function PlatformStatusBadge({ status }: { status: PlatformStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'active'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : status === 'suspended'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Register form schema ───────────────────────────────────────────────────────

const registerSchema = z.object({
  platform_id: z
    .string()
    .min(3, 'Platform ID must be at least 3 characters')
    .regex(/^[a-z0-9_-]+$/, 'Only lowercase letters, numbers, underscores, hyphens'),
  platform_name: z.string().min(2, 'Platform name required'),
  webhook_url: z.string().url('Must be a valid URL'),
  entity_types_raw: z
    .string()
    .min(1, 'At least one entity type required'),
  contact_email: z.string().email('Valid email required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// ── Register modal ─────────────────────────────────────────────────────────────

function RegisterModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [registerPlatform, { isLoading }] = useRegisterPlatformMutation();
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      platform_id: '',
      platform_name: '',
      webhook_url: '',
      entity_types_raw: '',
      contact_email: '',
    },
  });

  const handleClose = () => {
    reset();
    setNewApiKey(null);
    setCopied(false);
    onClose();
  };

  const copyKey = async () => {
    if (!newApiKey) return;
    await navigator.clipboard.writeText(newApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const entity_types = values.entity_types_raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await registerPlatform({
        platform_id: values.platform_id,
        platform_name: values.platform_name,
        webhook_url: values.webhook_url,
        entity_types,
        contact_email: values.contact_email,
      }).unwrap();

      setNewApiKey(res.platform_api_key);
      toast({ title: 'Platform registered successfully' });
    } catch {
      toast({ title: 'Registration failed', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register New Platform</DialogTitle>
        </DialogHeader>

        {newApiKey ? (
          /* Step 2: Show API key */
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 p-4">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                Platform registered!
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                Copy and securely store this API key. It will not be shown again.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>API Key (copy now)</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-mono text-green-400 overflow-x-auto">
                  {newApiKey}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={copyKey}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          /* Step 1: Registration form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="platform_id">Platform ID</Label>
                <input
                  id="platform_id"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                  placeholder="my_platform_01"
                  {...register('platform_id')}
                />
                {errors.platform_id && (
                  <p className="text-xs text-red-500">{errors.platform_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="platform_name">Platform Name</Label>
                <input
                  id="platform_name"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="My Platform"
                  {...register('platform_name')}
                />
                {errors.platform_name && (
                  <p className="text-xs text-red-500">{errors.platform_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <input
                id="webhook_url"
                type="url"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                placeholder="https://api.myplatform.com/webhooks/pss"
                {...register('webhook_url')}
              />
              {errors.webhook_url && (
                <p className="text-xs text-red-500">{errors.webhook_url.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entity_types_raw">
                Entity Types{' '}
                <span className="text-gray-400 font-normal">(comma-separated)</span>
              </Label>
              <input
                id="entity_types_raw"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="driver, restaurant, courier"
                {...register('entity_types_raw')}
              />
              {errors.entity_types_raw && (
                <p className="text-xs text-red-500">{errors.entity_types_raw.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_email">Contact Email</Label>
              <input
                id="contact_email"
                type="email"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="admin@myplatform.com"
                {...register('contact_email')}
              />
              {errors.contact_email && (
                <p className="text-xs text-red-500">{errors.contact_email.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Registering…' : 'Register Platform'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Columns ────────────────────────────────────────────────────────────────────

const columns: ColumnDef<Platform, unknown>[] = [
  {
    accessorKey: 'platform_id',
    header: 'Platform ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{row.original.platform_id}</span>
    ),
  },
  {
    accessorKey: 'platform_name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium text-gray-900 dark:text-gray-100">{row.original.platform_name}</span>
    ),
  },
  {
    accessorKey: 'entity_types',
    header: 'Entity Types',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.entity_types.map((et) => (
          <span
            key={et}
            className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300"
          >
            {et}
          </span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <PlatformStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'contact_email',
    header: 'Contact',
    cell: ({ row }) => (
      <span className="text-xs text-gray-500 dark:text-gray-400">{row.original.contact_email}</span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Registered',
    cell: ({ row }) => (
      <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(row.original.created_at)}</span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: () => (
      <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-800">
        <ExternalLink className="h-3.5 w-3.5 mr-1" />
        Manage
      </Button>
    ),
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PlatformsPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: platforms, isLoading } = useGetAllPlatformsQuery();

  const active = platforms?.filter((p) => p.status === 'active').length ?? 0;
  const suspended = platforms?.filter((p) => p.status === 'suspended').length ?? 0;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Platforms</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{platforms?.length ?? 0}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">{active}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Suspended</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">{suspended}</p>
          </div>
        </div>

        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Register Platform
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={platforms ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No platforms registered."
        onRowClick={(row) => router.push(`/platforms/${row.platform_id}`)}
      />

      {/* Register modal */}
      <RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
