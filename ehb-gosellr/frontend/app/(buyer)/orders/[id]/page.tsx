'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useGetOrderQuery, useUpdateOrderStatusMutation } from '@/lib/store/api/orders.api';
import { selectCurrentUser, selectToken } from '@/lib/store/auth.slice';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed by Seller',
  ready_for_delivery: 'Ready for Pickup',
  picked: 'Rider Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_ICONS: Record<string, string> = {
  pending: '🛒',
  confirmed: '✅',
  ready_for_delivery: '📦',
  picked: '🏍️',
  out_for_delivery: '🚚',
  delivered: '🎉',
  cancelled: '❌',
};

const STATUS_ORDER = ['pending', 'confirmed', 'ready_for_delivery', 'picked', 'out_for_delivery', 'delivered'];

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectToken);

  // Poll every 10s as primary real-time mechanism; WS upgrades this when available
  const { data: order, refetch, isLoading } = useGetOrderQuery(id, {
    skip: !id,
    pollingInterval: 10000,
  });
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [wsConnected, setWsConnected] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'buyer') { router.push('/'); return; }
  }, [user, router]);

  // Try to connect WebSocket — dynamic import so missing package won't break build
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const { io } = await import('socket.io-client');
        if (cancelled) return;

        const apiUrl = process.env.NEXT_PUBLIC_GOSELLR_API_URL ?? 'http://localhost:3002/api';
        const wsUrl = apiUrl.replace('/api', '');
        const socket = io(`${wsUrl}/orders`, { transports: ['websocket'], auth: { token } });
        socketRef.current = socket;

        socket.on('connect', () => {
          setWsConnected(true);
          socket.emit('join:order', id);
          if (user?.id) socket.emit('join:user', user.id);
        });
        socket.on('disconnect', () => setWsConnected(false));
        socket.on('order:updated', (p: unknown) => {
          const payload = p as { orderId: string };
          if (payload.orderId === id) refetch();
        });
      } catch {
        // socket.io-client not installed — polling fallback active
      }
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
    };
  }, [id, token, user?.id, refetch]);

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return;
    try {
      await updateStatus({ id, status: 'cancelled', note: 'Cancelled by buyer' }).unwrap();
      refetch();
    } catch { alert('Cannot cancel at this stage.'); }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-success-500" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">Order not found.</div>
  );

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="min-h-screen bg-surface-alt">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/orders')} className="text-muted-foreground hover:text-foreground">← Back</button>
          <h1 className="text-lg font-bold text-foreground">Order #{order.id.slice(-8).toUpperCase()}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-success-500' : 'bg-warning-400'}`} />
          <span className="text-xs text-muted-foreground">{wsConnected ? 'Live' : 'Polling'}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Status Banner */}
        <div className={`rounded-xl p-5 text-white ${isCancelled ? 'bg-destructive' : 'bg-success-500'}`}>
          <div className="text-3xl mb-1">{STATUS_ICONS[order.status] ?? '📋'}</div>
          <div className="text-xl font-bold">{STATUS_LABELS[order.status] ?? order.status}</div>
          <div className="text-sm opacity-80 mt-1">
            Updated {new Date(order.updated_at ?? order.created_at).toLocaleString()}
          </div>
        </div>

        {/* Progress */}
        {!isCancelled && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-muted-foreground mb-4 tracking-widest">ORDER PROGRESS</h2>
            <div className="space-y-1">
              {STATUS_ORDER.map((s, idx) => (
                <div key={s} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                      ${idx < currentIdx ? 'bg-success-500 text-white' :
                        idx === currentIdx ? 'bg-success-600 text-white ring-2 ring-green-200' :
                        'bg-surface-alt text-muted-foreground'}`}>
                      {idx < currentIdx ? '✓' : STATUS_ICONS[s]}
                    </div>
                    {idx < STATUS_ORDER.length - 1 && (
                      <div className={`w-0.5 h-4 mt-1 ${idx < currentIdx ? 'bg-success-500' : 'bg-surface-muted'}`} />
                    )}
                  </div>
                  <div className="pt-1 pb-3">
                    <div className={`text-sm font-medium
                      ${idx === currentIdx ? 'text-success-700' : idx < currentIdx ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {STATUS_LABELS[s]}
                    </div>
                    {idx === currentIdx && <div className="text-xs text-success-600 mt-0.5">Current status</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 tracking-widest">ITEMS</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.product_image_url
                  ? <img src={item.product_image_url} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover" />
                  : <div className="w-12 h-12 rounded-lg bg-surface-alt flex items-center justify-center text-xl">📦</div>}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{item.product_name}</div>
                  <div className="text-sm text-muted-foreground">{item.quantity} × PKR {item.unit_price.toLocaleString()}</div>
                </div>
                <div className="font-semibold shrink-0">PKR {item.subtotal.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>PKR {order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm text-muted-foreground"><span>Delivery</span><span>PKR {order.delivery_fee.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-foreground pt-1.5 border-t"><span>Total</span><span>PKR {order.total.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-muted-foreground mb-2 tracking-widest">DELIVERY ADDRESS</h2>
          <div className="text-foreground">{order.delivery_address.address_line}</div>
          <div className="text-muted-foreground text-sm">{order.delivery_address.area}, {order.delivery_address.city}</div>
          {order.buyer_notes && <div className="mt-2 text-sm text-muted-foreground italic border-t pt-2">Note: {order.buyer_notes}</div>}
        </div>

        {/* History */}
        {order.status_history && order.status_history.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-muted-foreground mb-3 tracking-widest">HISTORY</h2>
            <div className="space-y-2">
              {[...order.status_history].reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-muted-foreground text-xs shrink-0 mt-0.5 w-28">
                    {new Date(h.timestamp).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div>
                    <span className="font-medium text-foreground">{STATUS_LABELS[h.status] ?? h.status}</span>
                    {h.note && <span className="text-muted-foreground ml-1">— {h.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {canCancel && (
          <button onClick={handleCancel}
            className="w-full py-3 rounded-xl border-2 border-destructive/30 text-destructive font-semibold hover:bg-destructive/10 transition-colors">
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}
