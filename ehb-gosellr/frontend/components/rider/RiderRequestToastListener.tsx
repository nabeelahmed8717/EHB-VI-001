'use client';

import { useRouter } from 'next/navigation';
import { useOrdersSocket } from '@/lib/hooks/useOrdersSocket';
import { toast } from '@/components/ui/toaster';

/**
 * Mounts the WS subscription for the rider's layout. Whenever a fresh
 * delivery_request:new lands, pops a toast with a deep-link cue. The
 * actual list is on the Requests page; this just makes sure the rider
 * notices when they're not already looking at it.
 *
 * Keep this component empty in the DOM — it's effects-only.
 */
export function RiderRequestToastListener() {
  const router = useRouter();
  useOrdersSocket({
    onDeliveryRequestNew: (p) => {
      toast({
        title: 'New delivery request',
        description: `Order #${p.order_id.slice(-8)} · PKR ${p.delivery_fee} — tap Requests to respond`,
      });
      // Best-effort prefetch of the Requests page so navigation is instant.
      router.prefetch('/dashboard/rider/requests');
    },
    onDeliveryRequestEvent: (event, p) => {
      // Inform the rider when the seller bails or the timer runs out so the
      // toast they just got doesn't sit lying to them in the tray.
      if (event === 'delivery_request:cancelled') {
        toast({
          title: 'Request cancelled',
          description: `Order #${p.order_id.slice(-8)} was withdrawn by the seller.`,
        });
      } else if (event === 'delivery_request:expired') {
        toast({
          title: 'Request expired',
          description: `You didn't respond to order #${p.order_id.slice(-8)} in time.`,
        });
      }
    },
  });
  return null;
}
