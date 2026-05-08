'use client';

import { useState } from 'react';
import { useGetMyOrdersQuery, useUpdateOrderStatusMutation } from '@/lib/store/api/orders.api';
import type { Order, OrderStatus } from '@/lib/store/api/orders.api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-500',
  confirmed: 'bg-accent-50 text-accent',
  ready_for_delivery: 'bg-accent-100 text-accent-700',
  picked: 'bg-primary-100 text-primary-700',
  out_for_delivery: 'bg-warning-50 text-warning-500',
  delivered: 'bg-success-50 text-success-700',
  cancelled: 'bg-destructive/10 text-destructive',
};

const SELLER_ACTIONS: Record<string, OrderStatus | null> = {
  pending: 'confirmed', confirmed: 'ready_for_delivery', ready_for_delivery: null,
  picked: null, out_for_delivery: null, delivered: null, cancelled: null,
};

const ACTION_LABELS: Record<string, string> = {
  confirmed: 'Confirm order', ready_for_delivery: 'Mark ready for pickup',
};

export default function SellerOrdersPage() {
  const { data: orders = [], isLoading, refetch } = useGetMyOrdersQuery();
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [filter, setFilter] = useState<string>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const statuses = ['all', 'pending', 'confirmed', 'ready_for_delivery', 'picked', 'out_for_delivery', 'delivered', 'cancelled'];
  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  async function advance(order: Order) {
    const next = SELLER_ACTIONS[order.status];
    if (!next) return;
    setBusy(order.id);
    await updateStatus({ id: order.id, status: next }).unwrap().catch(() => undefined);
    setBusy(null);
    refetch();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Orders</h1>

      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-pill text-sm font-medium capitalize transition-colors ${
              filter === s ? 'bg-accent text-accent-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-surface-alt hover:text-foreground'
            }`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No orders found</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const nextAction = SELLER_ACTIONS[order.status];
            return (
              <div key={order.id} className="bg-card rounded-xl border border-border shadow-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">#{order.id.slice(-8)}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-pill font-semibold ${STATUS_COLORS[order.status]}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} · PKR {order.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.delivery_address.area}, {order.delivery_address.city}</p>
                  </div>
                  {nextAction && ACTION_LABELS[nextAction] && (
                    <button onClick={() => advance(order)} disabled={busy === order.id}
                      className="text-sm bg-accent hover:bg-accent-600 text-accent-foreground px-4 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap font-semibold transition-colors">
                      {busy === order.id ? '…' : ACTION_LABELS[nextAction]}
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-1 pt-3 border-t border-border">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-muted-foreground">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span>PKR {item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
