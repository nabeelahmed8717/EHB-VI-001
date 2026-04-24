'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { useGetMyProductsQuery } from '@/lib/store/api/products.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SqStatusPill } from '@/components/sq/sq-status-pill';
import { formatPrice } from '@/lib/utils';
import { Package, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SellerDashboardPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const { data, isLoading } = useGetMyProductsQuery({ page: 1, limit: 100 });

  const products = data?.data ?? [];
  const total = products.length;
  const approved = products.filter((p) => p.sq_status === 'approved').length;
  const pending = products.filter((p) =>
    ['pending', 'pending_franchise', 'pending_edr'].includes(p.sq_status),
  ).length;
  const rejected = products.filter((p) => p.sq_status === 'rejected').length;

  const recent = products.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.full_name}</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: total, icon: Package, color: 'text-blue-600' },
          { label: 'Approved', value: approved, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Pending SQ', value: pending, icon: Clock, color: 'text-yellow-600' },
          { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{isLoading ? '—' : value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Products</CardTitle>
            <Link href="/dashboard/products">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No products yet. Add your first product!</p>
          ) : (
            <div className="divide-y">
              {recent.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(p.price)} · {p.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SqStatusPill status={p.sq_status} />
                    <Link href={`/dashboard/products/${p._id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
