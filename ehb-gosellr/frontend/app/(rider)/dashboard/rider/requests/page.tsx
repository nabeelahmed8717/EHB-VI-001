'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, X, MapPin } from 'lucide-react';
import {
  useGetPendingDeliveryRequestsQuery,
  useAcceptDeliveryRequestMutation,
  useRejectDeliveryRequestMutation,
  type DeliveryRequest,
} from '@/lib/store/api/delivery-requests.api';
import { toast } from '@/components/ui/toaster';

function secondsUntil(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

export default function RiderRequestsPage() {
  const { data: requests = [], isLoading, refetch } = useGetPendingDeliveryRequestsQuery();
  const [accept, { isLoading: accepting }] = useAcceptDeliveryRequestMutation();
  const [reject, { isLoading: rejecting }] = useRejectDeliveryRequestMutation();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Tick every second so countdowns refresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (requests.length === 0) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [requests.length]);

  // When any countdown hits 0, the server may have already expired it —
  // refetch lazily so the list shrinks.
  useEffect(() => {
    if (requests.some((r) => secondsUntil(r.expires_at) <= 0)) {
      void refetch();
    }
  });

  async function handleAccept(req: DeliveryRequest) {
    setBusyId(req.id);
    try {
      await accept(req.id).unwrap();
      toast({
        title: 'Order locked in',
        description: `Head to the pickup when you're ready, then mark it Picked from Active.`,
      });
    } catch (err) {
      const e = err as { data?: { message?: string } };
      toast({
        variant: 'destructive',
        title: 'Could not accept',
        description: e.data?.message ?? 'Maybe it expired — please refresh.',
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(req: DeliveryRequest) {
    setBusyId(req.id);
    try {
      await reject({ id: req.id }).unwrap();
      toast({ title: 'Request declined' });
    } catch {
      toast({ variant: 'destructive', title: 'Could not decline' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Pending requests</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sellers send delivery requests to you directly. Accept within 60 seconds.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No pending requests right now.</p>
          <p className="text-xs mt-1">Stay online — sellers can only reach you when you're available.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const remaining = secondsUntil(req.expires_at);
            const isBusy = busyId === req.id;
            return (
              <div
                key={req.id}
                className="bg-card rounded-xl border border-border shadow-card p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-foreground">
                      Order #{req.order_id.slice(-8)}
                    </p>
                    <p className="text-sm font-medium text-success-700 mt-1">
                      Delivery fee: PKR {req.delivery_fee.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      Sent by seller — full address shown after accept
                    </div>
                  </div>
                  <div
                    className={`font-mono text-sm font-bold px-2.5 py-1 rounded-pill ${
                      remaining < 15
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-accent-50 text-accent-700'
                    }`}
                  >
                    {remaining}s
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleAccept(req)}
                    disabled={isBusy || accepting || remaining <= 0}
                    className="flex-1 bg-success-600 hover:bg-success-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(req)}
                    disabled={isBusy || rejecting}
                    className="flex-1 bg-card border border-border hover:bg-surface-alt text-foreground text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
