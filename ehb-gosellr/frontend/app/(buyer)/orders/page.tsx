'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useGetMyOrdersQuery } from '@/lib/store/api/orders.api';
import { selectCurrentUser } from '@/lib/store/auth.slice';
import { Truck, Package, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', ready_for_delivery: 'Ready',
  picked: 'Picked Up', out_for_delivery: 'On the Way', delivered: 'Delivered', cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-500',
  confirmed: 'bg-accent-50 text-accent',
  ready_for_delivery: 'bg-accent-100 text-accent-700',
  picked: 'bg-primary-100 text-primary-700',
  out_for_delivery: 'bg-warning-50 text-warning-500',
  delivered: 'bg-success-50 text-success-700',
  cancelled: 'bg-destructive/10 text-destructive',
};

const TABS = ['all', 'pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'] as const;
type Tab = typeof TABS[number];

export default function BuyerOrdersPage() {
  const router = useRouter();
  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const { data: orders = [], isLoading, refetch } = useGetMyOrdersQuery(undefined, { skip: !user, pollingInterval: 30000 });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'buyer') { router.push('/dashboard'); return; }
  }, [user, router]);

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);
  const tabLabel = (t: Tab) => {
    if (t === 'all') return `All (${orders.length})`;
    const count = orders.filter(o => o.status === t).length;
    return `${STATUS_LABELS[t]}${count > 0 ? ` (${count})` : ''}`;
  };

  return (
    <div className="-mx-4 md:-mx-6 -my-6 md:-my-8 min-h-[calc(100vh-200px)]">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition-colors">← Home</button>
          <h1 className="text-lg font-bold text-foreground">My Orders</h1>
        </div>
        <button onClick={() => refetch()} className="text-sm text-accent hover:text-accent-700 font-semibold">↻ Refresh</button>
      </header>

      <div className="bg-card border-b border-border px-4">
        <div className="flex gap-0 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {tabLabel(tab)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <div className="text-foreground text-lg font-bold mb-1">No orders here</div>
            <div className="text-muted-foreground text-sm mb-6">
              {activeTab === 'all' ? 'Start shopping to see your orders here' : `No ${STATUS_LABELS[activeTab]?.toLowerCase()} orders`}
            </div>
            {activeTab === 'all' && (
              <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-accent text-accent-foreground rounded-pill font-semibold hover:bg-accent-600 transition-colors">
                Browse Products
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div key={order.id} onClick={() => router.push(`/orders/${order.id}`)}
                className="bg-card rounded-xl border border-border p-4 shadow-card cursor-pointer hover:shadow-md active:scale-[0.99] transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-foreground text-sm">#{order.id.slice(-8).toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-pill text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-surface-alt text-muted-foreground'}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {order.items.slice(0, 3).map((item, i) => (
                    item.product_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={item.product_image_url} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div key={i} className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center text-muted-foreground flex-shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                    )
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center text-xs text-muted-foreground font-medium flex-shrink-0">
                      +{order.items.length - 3}
                    </div>
                  )}
                  <div className="ml-1 text-sm text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {order.delivery_address.city}
                  </div>
                  <div className="font-bold text-foreground">{formatPrice(order.total)}</div>
                </div>
                {(order.status === 'picked' || order.status === 'out_for_delivery') && (
                  <div className="mt-3 flex items-center gap-2 bg-warning-50 rounded-lg px-3 py-2 text-warning-500 text-xs font-semibold">
                    <Truck className="w-4 h-4 animate-pulse-soft" />
                    <span>Your order is on the way — tap to track live</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
