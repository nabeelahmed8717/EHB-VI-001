'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, BadgeCheck, MapPin, Bike, Circle } from 'lucide-react';
import {
  useGetAvailableRidersQuery,
  useSendDeliveryRequestMutation,
  type AvailableRider,
  type RiderAvailability,
} from '@/lib/store/api/delivery-requests.api';
import { toast } from '@/components/ui/toaster';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderArea: string;
}

const AVAILABILITY_LABEL: Record<RiderAvailability, string> = {
  online: 'Online',
  on_delivery: 'On delivery',
  offline: 'Offline',
};

const AVAILABILITY_DOT: Record<RiderAvailability, string> = {
  online: 'text-success-500 fill-success-500',
  on_delivery: 'text-warning-500 fill-warning-500',
  offline: 'text-muted-foreground fill-muted-foreground',
};

export function AssignRiderModal({ open, onOpenChange, orderId, orderArea }: Props) {
  const { data: riders = [], isLoading, isError, refetch } =
    useGetAvailableRidersQuery(orderId, { skip: !open });
  const [sendRequest, { isLoading: sending }] = useSendDeliveryRequestMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function handleSend(rider: AvailableRider) {
    setSelectedId(rider.rider_user_id);
    try {
      await sendRequest({
        orderId,
        riderJpsProfileId: rider.jps_profile_id,
        riderUserId: rider.rider_user_id,
      }).unwrap();
      toast({
        title: 'Request sent',
        description: `Waiting for ${rider.display_name} to accept (60s)`,
      });
      onOpenChange(false);
    } catch (err) {
      const e = err as { data?: { message?: string } };
      toast({
        variant: 'destructive',
        title: 'Could not send request',
        description: e.data?.message ?? 'Please try again.',
      });
    } finally {
      setSelectedId(null);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-2xl shadow-xl p-0 max-h-[85vh] flex flex-col">
          <div className="flex items-start justify-between px-6 py-5 border-b border-border">
            <div>
              <Dialog.Title className="text-lg font-bold text-foreground">
                Assign a rider
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                Delivery to {orderArea}. Online riders are shown first.
              </Dialog.Description>
            </div>
            <Dialog.Close className="text-muted-foreground hover:text-foreground p-1 rounded-md">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto px-3 py-3 flex-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground px-3 py-8 text-center">
                Loading riders…
              </p>
            ) : isError ? (
              <div className="text-sm text-destructive px-3 py-8 text-center">
                <p>Could not load riders.</p>
                <button
                  onClick={() => refetch()}
                  className="text-accent hover:underline mt-2"
                >
                  Try again
                </button>
              </div>
            ) : riders.length === 0 ? (
              <p className="text-sm text-muted-foreground px-3 py-8 text-center">
                No SQ-approved riders found for gosellr. Riders must complete JPS verification first.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {riders.map((r) => {
                  const isSending = sending && selectedId === r.rider_user_id;
                  const canRequest = r.availability !== 'on_delivery';
                  return (
                    <li
                      key={r.rider_user_id}
                      className="flex items-center justify-between gap-4 px-3 py-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-accent-50 text-accent-700 flex items-center justify-center font-semibold shrink-0">
                          {r.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground truncate">
                              {r.display_name}
                            </p>
                            {r.sq_badge_label && (
                              <span className="inline-flex items-center gap-1 text-xs bg-accent-50 text-accent-700 px-2 py-0.5 rounded-pill font-medium">
                                <BadgeCheck className="w-3 h-3" />
                                SQ{r.sq_level}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Circle className={`w-2 h-2 ${AVAILABILITY_DOT[r.availability]}`} />
                              {AVAILABILITY_LABEL[r.availability]}
                            </span>
                            {r.availability_zone && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {r.availability_zone}
                              </span>
                            )}
                            {r.vehicle_type && (
                              <span className="inline-flex items-center gap-1">
                                <Bike className="w-3 h-3" />
                                {r.vehicle_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSend(r)}
                        disabled={isSending || !canRequest}
                        className="text-sm bg-accent hover:bg-accent-600 text-accent-foreground px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-semibold transition-colors"
                        title={!canRequest ? 'Rider is on another delivery' : undefined}
                      >
                        {isSending ? 'Sending…' : 'Send request'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
