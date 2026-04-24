'use client';

import Link from 'next/link';
import { useGetMyProductsQuery, useSubmitForSQMutation } from '@/lib/store/api/products.api';
import { toast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { SqStatusPill } from '@/components/sq/sq-status-pill';
import { SqBadge } from '@/components/sq/sq-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';

function rowColor(status: string): string {
  if (status === 'approved') return 'bg-green-50';
  if (status === 'rejected') return 'bg-red-50';
  if (status === 'pending') return 'bg-yellow-50';
  if (status === 'pending_franchise' || status === 'pending_edr') return 'bg-orange-50';
  return '';
}

export default function SqStatusPage() {
  const { data, isLoading, refetch } = useGetMyProductsQuery({ page: 1, limit: 100 });
  const [submitSQ, { isLoading: isSubmitting }] = useSubmitForSQMutation();

  const products = data?.data ?? [];

  const handleSubmit = async (id: string) => {
    try {
      await submitSQ(id).unwrap();
      toast({ title: 'Submitted for SQ approval' });
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast({ title: 'Error', description: e?.data?.message ?? 'Submission failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">SQ Status Overview</h1>
      <p className="text-muted-foreground text-sm">All your products and their current SQ approval status.</p>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : products.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No products yet.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Product', 'SQ Status', 'SQ Level', 'Request ID', 'Action'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p._id} className={cn('transition-colors', rowColor(p.sq_status))}>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/products/${p._id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><SqStatusPill status={p.sq_status} /></td>
                  <td className="px-4 py-3"><SqBadge level={p.sq_level} label={p.sq_badge_label} size="sm" /></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {p.sq_request_id ? p.sq_request_id.slice(0, 16) + '…' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {(p.sq_status === 'not_submitted' || p.sq_status === 'rejected') && (
                      <Button variant="outline" size="sm" disabled={isSubmitting} onClick={() => handleSubmit(p._id)}>
                        <Send className="h-3 w-3 mr-1" />Submit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
