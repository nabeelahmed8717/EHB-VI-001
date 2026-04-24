'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetMyProductsQuery, useSubmitForSQMutation, type SqStatus } from '@/lib/store/api/products.api';
import { toast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { SqStatusPill } from '@/components/sq/sq-status-pill';
import { SqBadge } from '@/components/sq/sq-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { Plus, Send } from 'lucide-react';

const SQ_STATUSES: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'not_submitted', label: 'Not Submitted' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function MyProductsPage() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useGetMyProductsQuery({ page, limit: 20 });
  const [submitSQ, { isLoading: isSubmitting }] = useSubmitForSQMutation();

  const products = (data?.data ?? []).filter(
    (p) => filterStatus === 'all' || p.sq_status === filterStatus,
  );

  const handleSubmit = async (id: string, title: string) => {
    try {
      await submitSQ(id).unwrap();
      toast({ title: 'Submitted!', description: `"${title}" sent for SQ approval` });
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast({ title: 'Submission failed', description: e?.data?.message ?? 'Try again', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link href="/dashboard/products/new">
          <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {SQ_STATUSES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{products.length} products</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No products found.</p>
          <Link href="/dashboard/products/new" className="text-primary hover:underline text-sm">Add your first product</Link>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Product', 'Category', 'Price', 'SQ Status', 'SQ Level', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3"><SqStatusPill status={p.sq_status} /></td>
                  <td className="px-4 py-3"><SqBadge level={p.sq_level} label={p.sq_badge_label} size="sm" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/products/${p._id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      {(p.sq_status === 'not_submitted' || p.sq_status === 'rejected') && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => handleSubmit(p._id, p.title)}
                        >
                          <Send className="h-3 w-3 mr-1" />SQ
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm">{page} / {data.total_pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
