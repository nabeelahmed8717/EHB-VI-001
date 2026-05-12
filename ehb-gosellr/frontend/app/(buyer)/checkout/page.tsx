'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetCartQuery, useCreateOrderMutation } from '@/lib/store/api/orders.api';
import { MapPin, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart } = useGetCartQuery();
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const items = cart?.items ?? [];
  const subtotal = cart?.total ?? 0;
  const deliveryFee = 150;

  async function handlePlace(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (items.length === 0) { setError('Your cart is empty'); return; }
    const sellerId = items[0].seller_id ?? '';
    if (!sellerId) {
      setError(
        'Your cart contains items from before seller tracking was added. ' +
        'Please remove and re-add them to continue.',
      );
      return;
    }
    try {
      const order = await createOrder({
        seller_id: sellerId,
        items: items.map((i) => ({
          product_id: i.product_id, product_name: i.product_name,
          product_image_url: i.product_image_url ?? null, unit_price: i.unit_price,
          quantity: i.quantity, subtotal: i.subtotal,
        })),
        delivery_address: { address_line: addressLine, city, area },
        delivery_fee: deliveryFee, buyer_notes: notes || undefined,
      }).unwrap();
      router.push(`/orders/${order.id}`);
    } catch (e: unknown) {
      const msg = (e as { data?: { message?: string } }).data?.message;
      setError(msg ?? 'Failed to place order');
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Checkout</h1>
      <form onSubmit={handlePlace} className="space-y-5">
        <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" /> Delivery address
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Address</label>
            <input required value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Street, building, floor…"
              className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">City</label>
              <input required value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Area</label>
              <input required value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Gulberg"
                className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Notes for rider (optional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-5 space-y-3">
          <h2 className="font-bold text-foreground">Order summary</h2>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-muted-foreground">
              <span>{item.product_name} × {item.quantity}</span>
              <span>{formatPrice(item.subtotal)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-sm text-muted-foreground"><span>Delivery</span><span>{formatPrice(deliveryFee)}</span></div>
            <div className="flex justify-between font-bold text-foreground"><span>Total</span><span>{formatPrice(subtotal + deliveryFee)}</span></div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={isLoading || items.length === 0}
          className="w-full bg-accent hover:bg-accent-600 text-accent-foreground rounded-pill py-3.5 font-semibold text-base disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing order…</> : 'Place order (Cash on delivery)'}
        </button>
      </form>
    </div>
  );
}
