'use client';

import { useGetAvailableOrdersQuery, useAssignRiderMutation, useUpdateOrderStatusMutation } from '@/lib/store/api/orders.api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { MapPin, Package } from 'lucide-react';

export default function AvailableOrdersPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: orders = [], isLoading, refetch } = useGetAvailableOrdersQuery();
  const [assignRider] = useAssignRiderMutation();
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [busy, setBusy] = useState<string | null>(null);

  async function accept(orderId: string) {
    if (!user) return;
    setBusy(orderId);
    try {
      await assignRider({ id: orderId, rider_id: user.id }).unwrap();
      await updateStatus({ id: orderId, status: 'picked', note: 'Rider accepted and picked up' }).unwrap();
      refetch();
    } catch { /* ignore */ }
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Available orders</h1>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No orders available right now. Stay online!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">#{order.id.slice(-8)}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {order.delivery_address.area}, {order.delivery_address.city}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} · PKR {order.total.toLocaleString()}
                  </p>
                  <p className="text-sm font-medium text-success-600 mt-1">
                    Delivery fee: PKR {order.delivery_fee}
                  </p>
                </div>
                <button
                  onClick={() => accept(order.id)}
                  disabled={busy === order.id}
                  className="bg-success-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap"
                >
                  {busy === order.id ? '…' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// useState import needed
import { useState } from 'react';
