'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  ArrowLeft, MessageSquare, Package, Store, ShoppingCart, Zap, Loader2,
} from 'lucide-react';
import { useGetProductByIdQuery } from '@/lib/store/api/products.api';
import { useAddToCartMutation } from '@/lib/store/api/orders.api';
import { SqBadge } from '@/components/sq/sq-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toaster';
import { formatPrice } from '@/lib/utils';
import { OwnerSubsection } from '@/components/buyer/owner-subsection';
import type { RootState } from '@/lib/store';

export default function ProductDetailBuyerPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const { data: product, isLoading } = useGetProductByIdQuery(id);
  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();

  const requireBuyerLogin = (next: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gosellr_next', next);
    }
    router.push('/login');
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      requireBuyerLogin(`/browse/${id}`);
      return;
    }
    if (user?.role !== 'buyer') {
      toast({
        title: 'Switch to Buyer mode',
        description: 'Only buyers can add items to their cart.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await addToCart({
        product_id: product._id,
        product_name: product.title,
        product_image_url: product.images?.[0],
        unit_price: product.price,
        quantity: 1,
      }).unwrap();
      toast({ title: 'Added to cart', description: product.title });
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast({
        title: 'Could not add to cart',
        description: e?.data?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      requireBuyerLogin(`/browse/${id}`);
      return;
    }
    if (user?.role !== 'buyer') {
      toast({
        title: 'Switch to Buyer mode',
        description: 'Only buyers can purchase items.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await addToCart({
        product_id: product._id,
        product_name: product.title,
        product_image_url: product.images?.[0],
        unit_price: product.price,
        quantity: 1,
      }).unwrap();
      router.push('/checkout');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast({
        title: 'Could not start checkout',
        description: e?.data?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full rounded-lg" />
          <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!product) return <p className="text-muted-foreground">Product not found.</p>;

  const mainImage = product.images?.[0];
  const outOfStock = product.stock <= 0;

  return (
    <div className="max-w-7xl space-y-6">
      <Link href="/browse">
        <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back to Browse</Button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* ── Column 1: Image ─────────────────────────────────────────────── */}
        <div className="rounded-lg overflow-hidden bg-surface-alt h-80 flex items-center justify-center">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-16 w-16 text-muted-foreground" />
          )}
        </div>

        {/* ── Column 2: Title, price, stock, action buttons ───────────────── */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SqBadge level={product.sq_level} label={product.sq_badge_label} size="md" />
              <span className="text-xs bg-secondary text-secondary-foreground rounded px-2 py-0.5">{product.category}</span>
            </div>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <p className="text-3xl font-bold text-primary mt-2">{formatPrice(product.price)}</p>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium text-foreground">Stock:</span>{' '}
              {outOfStock ? (
                <span className="text-destructive font-semibold">Out of stock</span>
              ) : (
                `${product.stock} units available`
              )}
            </p>
            {product.sq_decided_at && (
              <p><span className="font-medium text-foreground">SQ Verified:</span> {new Date(product.sq_decided_at).toLocaleDateString()}</p>
            )}
          </div>

          {/* ── Action buttons (replaced the inline Store card) ──────────── */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full"
              size="lg"
              onClick={handleBuyNow}
              disabled={isAdding || outOfStock}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {outOfStock ? 'Out of stock' : 'Buy Now'}
            </Button>
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={handleAddToCart}
              disabled={isAdding || outOfStock}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Add to Cart
            </Button>
            <Button className="w-full" variant="ghost" disabled>
              <MessageSquare className="h-4 w-4 mr-2" />Contact Seller (coming soon)
            </Button>
            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground text-center">
                You&apos;ll be asked to sign in before checkout.
              </p>
            )}
          </div>
        </div>

        {/* ── Column 3: Store + Owner sub-section ─────────────────────────── */}
        <aside className="md:col-span-2 lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-4 shadow-card sticky top-20">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center overflow-hidden">
                {product.store?.store_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.store.store_logo_url}
                    alt={product.store.business_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted-foreground">Store</p>
                <p className="font-bold text-foreground truncate">
                  {product.store?.business_name ?? 'GoSellr Store'}
                </p>
                {product.store?.business_category && (
                  <p className="text-xs text-muted-foreground">
                    {product.store.business_category}
                  </p>
                )}
                {product.store?.sq_status === 'approved' && product.store.sq_badge_label && (
                  <p className="text-xs text-success-700 mt-1">
                    ✓ Store {product.store.sq_badge_label}
                  </p>
                )}
                {product.sq_status === 'approved' && (
                  <p className="text-xs text-success-700 mt-1">
                    ✓ SQ Verified Product
                    {product.sq_badge_label && ` · ${product.sq_badge_label}`}
                  </p>
                )}
              </div>
            </div>
            <OwnerSubsection owner={product.owner} />
          </div>
        </aside>
      </div>

      {/* Description */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">Product Description</h2>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
      </div>

      {/* Image gallery */}
      {product.images.length > 1 && (
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-3">More Images</h2>
          <div className="flex gap-2 flex-wrap">
            {product.images.slice(1).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={img} alt={`Product image ${i + 2}`} className="h-20 w-20 object-cover rounded-md border" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
