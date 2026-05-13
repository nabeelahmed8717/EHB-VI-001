'use client';

import { useMemo, useState } from 'react';
import { useGetMyOrdersQuery } from '@/lib/store/api/orders.api';
import type { Order } from '@/lib/store/api/orders.api';
import {
  CheckCircle2, XCircle, DollarSign, MapPin, Package, Calendar, Search,
} from 'lucide-react';

type Filter = 'all' | 'delivered' | 'cancelled';

const STATUS_TONE: Record<string, string> = {
  delivered: 'bg-success-50 text-success-700 border-success-100',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Rider delivery history — read-only ledger of every order this rider has
 * already finished, successful or otherwise. Uses the same /orders/my
 * endpoint that powers the dashboard and active pages, just filtered to
 * terminal statuses.
 */
export default function RiderHistoryPage() {
  const { data: orders = [], isLoading } = useGetMyOrdersQuery();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const history = useMemo(() => {
    return orders
      .filter((o) => o.status === 'delivered' || o.status === 'cancelled')
      .filter((o) => filter === 'all' ? true : o.status === filter)
      .filter((o) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return (
          o.id.toLowerCase().includes(q)
          || o.delivery_address.area?.toLowerCase().includes(q)
          || o.delivery_address.city?.toLowerCase().includes(q)
        );
      });
  }, [orders, filter, query]);

  // Stats
  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'delivered');
    const cancelled = orders.filter((o) => o.status === 'cancelled');
    const earnings = delivered.reduce((s, o) => s + (o.delivery_fee ?? 0), 0);
    return {
      total: delivered.length + cancelled.length,
      delivered: delivered.length,
      cancelled: cancelled.length,
      earnings,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Delivery history</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every order you&apos;ve completed, win or lose. Filter, search, or just scroll.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={Package} />
        <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} tone="success" />
        <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} tone="destructive" />
        <StatCard label="Earnings (PKR)" value={stats.earnings.toLocaleString()} icon={DollarSign} tone="accent" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex items-center gap-1 bg-card border border-border rounded-pill p-1">
          {(['all', 'delivered', 'cancelled'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-alt'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center bg-card border border-border rounded-pill h-10 px-3.5 gap-2 focus-within:border-accent transition-colors">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order id or area"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : history.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No matching deliveries.</p>
          <p className="text-xs mt-1">
            {orders.length === 0
              ? 'Once you accept and finish deliveries, they show up here.'
              : 'Try a different filter or clear the search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((order) => (
            <HistoryRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, tone = 'muted',
}: {
  label: string;
  value: number | string;
  icon: typeof Package;
  tone?: 'muted' | 'success' | 'destructive' | 'accent';
}) {
  const toneCls = {
    muted: 'text-muted-foreground',
    success: 'text-success-700',
    destructive: 'text-destructive',
    accent: 'text-accent',
  }[tone];

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-4">
      <div className={`flex items-center gap-2 text-xs ${toneCls} mb-1`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-2xl font-extrabold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function HistoryRow({ order }: { order: Order }) {
  const tone = STATUS_TONE[order.status] ?? 'bg-card text-muted-foreground border-border';
  // Pull the timestamp of the terminal status from status_history if available.
  const terminal = order.status_history?.find((s) => s.status === order.status);
  const date = (terminal?.timestamp as unknown as string) ?? (order as { updated_at?: string }).updated_at;

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-foreground">#{order.id.slice(-8)}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-pill font-semibold capitalize border ${tone}`}>
              {order.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {fmtDate(date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {order.delivery_address.area}, {order.delivery_address.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <Package className="w-3 h-3" />
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          {order.status === 'delivered' ? (
            <>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Earned</p>
              <p className="text-lg font-bold text-success-700">
                PKR {(order.delivery_fee ?? 0).toLocaleString()}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No earnings</p>
          )}
        </div>
      </div>
    </div>
  );
}
