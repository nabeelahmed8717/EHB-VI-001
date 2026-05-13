'use client';

import Link from 'next/link';
import {
  useGetRiderStatsQuery,
  useSetRiderAvailabilityMutation,
  useGetRiderProfileQuery,
} from '@/lib/store/api/rider.api';
import { useGetMyOrdersQuery } from '@/lib/store/api/orders.api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { Truck, Package, DollarSign, ToggleLeft, ToggleRight, ShieldAlert } from 'lucide-react';

export default function RiderDashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: stats, refetch } = useGetRiderStatsQuery();
  const { data: orders = [] } = useGetMyOrdersQuery();
  const { data: rider } = useGetRiderProfileQuery();
  const [setAvailability, { isLoading }] = useSetRiderAvailabilityMutation();
  const isJpsLinked = !!rider?.jps_profile_id;

  const isOnline = stats?.availability === 'online';
  const delivered = orders.filter((o) => o.status === 'delivered');
  const earnings = delivered.reduce((sum, o) => sum + o.delivery_fee, 0);

  async function toggleAvailability() {
    await setAvailability({ availability: isOnline ? 'offline' : 'online' }).unwrap().catch(() => undefined);
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Hey, {user?.full_name?.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{isOnline ? 'You are online and accepting deliveries' : 'You are offline'}</p>
        </div>
        <button onClick={toggleAvailability} disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-pill font-semibold text-sm transition-colors ${
            isOnline ? 'bg-success-50 text-success-700 hover:bg-success-100' : 'bg-surface-alt text-muted-foreground hover:bg-surface-muted'
          }`}>
          {isOnline ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          {isOnline ? 'Go offline' : 'Go online'}
        </button>
      </div>

      {!isJpsLinked && (
        <Link
          href="/dashboard/rider/jps-profile"
          className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 hover:bg-orange-100/60 transition-colors"
        >
          <ShieldAlert className="w-5 h-5 text-orange-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-900">Connect your JPS profile</p>
            <p className="text-xs text-orange-800 mt-0.5">
              Sellers can&apos;t send you delivery requests until you link a JPS profile.
              Click here to attach an existing one or create a new one.
            </p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Package className="w-4 h-4" /> Total deliveries</div>
          <span className="text-2xl font-extrabold text-foreground">{delivered.length}</span>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Truck className="w-4 h-4" /> Active</div>
          <span className="text-2xl font-extrabold text-foreground">{orders.filter((o) => o.status === 'picked' || o.status === 'out_for_delivery').length}</span>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /> Earnings (PKR)</div>
          <span className="text-2xl font-extrabold text-foreground">{earnings.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border"><h2 className="font-bold text-foreground">Recent deliveries</h2></div>
        {orders.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">No deliveries yet. Go online to receive orders.</p>
        ) : (
          <div className="divide-y divide-border">
            {orders.slice(0, 6).map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-alt/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-foreground">#{order.id.slice(-6)}</p>
                  <p className="text-xs text-muted-foreground">{order.delivery_address.area}, {order.delivery_address.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">PKR {order.delivery_fee}</p>
                  <span className="text-xs text-muted-foreground capitalize">{order.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
