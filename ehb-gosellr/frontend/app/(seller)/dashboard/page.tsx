'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { useGetSellerProfileQuery, useGetSellerStatsQuery } from '@/lib/store/api/seller.api';
import { useGetMyOrdersQuery } from '@/lib/store/api/orders.api';
import { getSqStatusConfig } from '@/lib/utils';
import type { SqStatus } from '@/lib/store/api/products.api';
import Link from 'next/link';
import { Package, ShoppingBag, Star, TrendingUp } from 'lucide-react';

export default function SellerDashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: profile } = useGetSellerProfileQuery();
  const { data: stats } = useGetSellerStatsQuery();
  const { data: orders = [] } = useGetMyOrdersQuery();

  const revenue = orders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const sqConfig = getSqStatusConfig((stats?.sq_status ?? 'not_submitted') as SqStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        {profile && <p className="text-muted-foreground mt-1">{profile.business_name}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Total orders" value={orders.length} />
        <StatCard icon={Package} label="Pending" value={pendingCount} accent />
        <StatCard icon={TrendingUp} label="Revenue (PKR)" value={revenue.toLocaleString()} />
        <div className="bg-card rounded-xl border border-border shadow-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Star className="w-4 h-4" />
            Trust score
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-pill w-fit ${sqConfig.color}`}>{sqConfig.label}</span>
          {stats?.sq_level !== null && stats?.sq_level !== undefined && (
            <span className="text-2xl font-extrabold text-foreground">L{stats.sq_level}</span>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-foreground">Recent orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-accent hover:text-accent-700 font-semibold">View all →</Link>
        </div>
        {orders.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">No orders yet</p>
        ) : (
          <div className="divide-y divide-border">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-alt/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-foreground">Order #{order.id.slice(-6)}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} · PKR {order.total.toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent = false }: {
  icon: React.ElementType; label: string; value: string | number; accent?: boolean;
}) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-4 flex flex-col gap-1">
      <div className={`flex items-center gap-2 text-sm ${accent ? 'text-warning-500' : 'text-muted-foreground'}`}>
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <span className="text-2xl font-extrabold text-foreground">{value}</span>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-500',
  confirmed: 'bg-accent-50 text-accent',
  ready_for_delivery: 'bg-accent-100 text-accent-700',
  picked: 'bg-primary-100 text-primary-700',
  out_for_delivery: 'bg-warning-50 text-warning-500',
  delivered: 'bg-success-50 text-success-700',
  cancelled: 'bg-destructive/10 text-destructive',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-pill capitalize ${STATUS_COLORS[status] ?? 'bg-surface-alt text-muted-foreground'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
