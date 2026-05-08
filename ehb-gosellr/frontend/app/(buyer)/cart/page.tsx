'use client';

import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from '@/lib/store/api/orders.api';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { data: cart, isLoading } = useGetCartQuery();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [clearCart] = useClearCartMutation();

  if (isLoading) return <p className="text-muted-foreground text-sm p-8">Loading cart…</p>;

  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;
  const deliveryFee = 150;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Your cart</h1>
        {items.length > 0 && (
          <button onClick={() => clearCart()} className="text-sm text-destructive hover:opacity-80 font-medium">
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Your cart is empty</p>
          <button onClick={() => router.push('/browse')} className="mt-4 text-sm text-accent hover:text-accent-700 font-semibold">
            Browse products →
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.product_id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-card">
                <div className="w-16 h-16 rounded-lg bg-surface-alt flex-shrink-0 overflow-hidden">
                  {item.product_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(item.unit_price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (item.quantity === 1) removeItem(item.product_id);
                      else updateItem({ productId: item.product_id, quantity: item.quantity - 1 });
                    }}
                    className="w-7 h-7 border border-border rounded-pill flex items-center justify-center hover:bg-surface-alt"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateItem({ productId: item.product_id, quantity: item.quantity + 1 })}
                    className="w-7 h-7 border border-border rounded-pill flex items-center justify-center hover:bg-surface-alt"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="font-bold text-foreground w-24 text-right">{formatPrice(item.subtotal)}</p>
                <button onClick={() => removeItem(item.product_id)} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove from cart">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-3 shadow-card">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery fee</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatPrice(total + deliveryFee)}</span>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="w-full bg-accent hover:bg-accent-600 text-accent-foreground rounded-pill py-3 font-semibold mt-2 transition-colors"
            >
              Proceed to checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
