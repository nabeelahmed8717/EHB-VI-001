'use client';

import { useGetMyOrdersQuery, useUpdateOrderStatusMutation } from '@/lib/store/api/orders.api';
import type { Order } from '@/lib/store/api/orders.api';
import { MapPin, CheckCircle } from 'lucide-react';
import { useState } from 'react';

// The rider drives the order from acceptance → delivered via these manual transitions.
// ready_for_delivery is included because that is the state of an order the rider
// just ACCEPTED via the delivery request — they still need to physically pick it up.
const RIDER_NEXT: Record<string, string | null> = {
  ready_for_delivery: 'picked',
  picked: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

const RIDER_NEXT_LABEL: Record<string, string> = {
  picked: 'Mark picked',
  out_for_delivery: 'Mark out for delivery',
  delivered: 'Mark delivered',
};

export default function ActiveDeliveryPage() {
  const { data: orders = [], refetch } = useGetMyOrdersQuery();
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [busy, setBusy] = useState<string | null>(null);

  // Active = order is assigned to me AND has not yet been delivered or cancelled.
  // Includes ready_for_delivery once the rider has accepted (rider_id !== null);
  // doesn't include unassigned ready_for_delivery orders (those are someone else's).
  const active = orders.filter(
    (o) =>
      o.rider_id != null &&
      (o.status === 'ready_for_delivery'
        || o.status === 'picked'
        || o.status === 'out_for_delivery'),
  );

  async function advance(order: Order) {
    const next = RIDER_NEXT[order.status];
    if (!next) return;
    setBusy(order.id);
    await updateStatus({ id: order.id, status: next as Order['status'] }).unwrap().catch(() => undefined);
    setBusy(null);
    refetch();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Active delivery</h1>
      {active.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-muted-foreground">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No active deliveries. Check your pending requests inbox.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map((order) => {
            const next = RIDER_NEXT[order.status];
            return (
              <div key={order.id} className="bg-white rounded-xl border p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-foreground text-lg">#{order.id.slice(-8)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      order.status === 'picked' ? 'bg-primary-100 text-primary' : 'bg-warning-100 text-warning-500'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {next && (
                    <button
                      onClick={() => advance(order)}
                      disabled={busy === order.id}
                      className="bg-success-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {busy === order.id ? '…' : RIDER_NEXT_LABEL[next]}
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.delivery_address.address_line}</p>
                    <p className="text-muted-foreground">{order.delivery_address.area}, {order.delivery_address.city}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-muted-foreground">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span>PKR {item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold text-foreground pt-1 border-t">
                    <span>Your fee</span>
                    <span className="text-success-600">PKR {order.delivery_fee}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
