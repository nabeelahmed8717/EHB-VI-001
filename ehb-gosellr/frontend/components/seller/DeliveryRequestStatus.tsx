'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import {
  useGetActiveDeliveryRequestQuery,
  useCancelDeliveryRequestMutation,
  type DeliveryRequest,
} from '@/lib/store/api/delivery-requests.api';
import { toast } from '@/components/ui/toaster';

interface Props {
  orderId: string;
  /** Render the "Assign Rider" button when no request is active. */
  onClickAssign: () => void;
}

function secondsUntil(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

/**
 * Lives on the seller's order card when status === ready_for_delivery.
 *
 * Renders one of four states:
 *   1. no active request          →  "Assign Rider" button
 *   2. pending                    →  "Waiting for <name>… 47s" + Cancel
 *   3. accepted                   →  "<name> accepted — awaiting pickup"
 *   4. rejected | expired | cancelled  →  "<reason>" + Assign another
 */
export function DeliveryRequestStatus({ orderId, onClickAssign }: Props) {
  const { data, refetch } = useGetActiveDeliveryRequestQuery(orderId);
  const [cancel, { isLoading: cancelling }] = useCancelDeliveryRequestMutation();
  const [now, setNow] = useState(Date.now());

  // Tick once a second only while there's a pending request to count down.
  useEffect(() => {
    if (data?.status !== 'pending') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [data?.status]);

  // When the pending request hits 0, refetch — server may have flipped to expired.
  useEffect(() => {
    if (data?.status === 'pending' && secondsUntil(data.expires_at) <= 0) {
      void refetch();
    }
  }, [now, data, refetch]);

  const req: DeliveryRequest | null = data ?? null;
  const isTerminal = req && ['rejected', 'expired', 'cancelled'].includes(req.status);

  if (!req || isTerminal) {
    return (
      <div className="flex flex-col items-end gap-2">
        {isTerminal && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-destructive" />
            {req!.status === 'rejected' && `${req!.rider_display_name} declined`}
            {req!.status === 'expired' && `${req!.rider_display_name} didn't respond`}
            {req!.status === 'cancelled' && 'Request cancelled'}
          </span>
        )}
        <button
          onClick={onClickAssign}
          className="text-sm bg-accent hover:bg-accent-600 text-accent-foreground px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors"
        >
          {isTerminal ? 'Assign another rider' : 'Assign rider'}
        </button>
      </div>
    );
  }

  if (req.status === 'pending') {
    const remaining = secondsUntil(req.expires_at);
    void now; // re-read on each tick
    return (
      <div className="flex flex-col items-end gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
          Waiting for {req.rider_display_name}…
          <span className="font-mono text-foreground">{remaining}s</span>
        </span>
        <button
          onClick={async () => {
            try {
              await cancel({ id: req.id, orderId }).unwrap();
              toast({ title: 'Request cancelled' });
            } catch {
              toast({ variant: 'destructive', title: 'Could not cancel' });
            }
          }}
          disabled={cancelling}
          className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50"
        >
          Cancel request
        </button>
      </div>
    );
  }

  // accepted
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-sm text-success-700 flex items-center gap-1.5 font-medium">
        <CheckCircle2 className="w-4 h-4" />
        {req.rider_display_name} accepted
      </span>
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Awaiting pickup
      </span>
    </div>
  );
}
