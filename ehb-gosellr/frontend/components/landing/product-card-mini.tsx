'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Heart, Star, Package, ShieldCheck, Clock, ShieldAlert, ShieldOff } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { RootState } from '@/lib/store';
import type { Product, SqStatus } from '@/lib/store/api/products.api';
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useGetWishlistIdsQuery,
} from '@/lib/store/api/wishlist.api';

interface ProductCardMiniProps {
  product: Product;
  showQuickAdd?: boolean;
  onAddToCart?: (product: Product) => void;
  demoRating?: { score: number; count: number };
  /**
   * If true, render a small SQ-status badge in the top-left corner so buyers
   * can tell verified vs pending vs rejected at a glance. Defaults to false
   * so themed rows (which only render approved products) stay clean.
   */
  showVerificationBadge?: boolean;
}

/**
 * Compact product card matching the reference style. Heart toggle wires to
 * the real wishlist API. When `showVerificationBadge` is true, the card also
 * shows a small SQ status pill (Verified / Pending / Rejected / Unverified).
 */
export function ProductCardMini({
  product,
  showQuickAdd = true,
  onAddToCart,
  demoRating,
  showVerificationBadge = false,
}: ProductCardMiniProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  const isBuyer = isAuthenticated && user?.role === 'buyer';
  const { data: wishlistIds } = useGetWishlistIdsQuery(undefined, { skip: !isBuyer });
  const [addToWishlist, addState] = useAddToWishlistMutation();
  const [removeFromWishlist, removeState] = useRemoveFromWishlistMutation();

  const liked = !!wishlistIds?.data?.includes(product._id);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const isLiked = optimistic ?? liked;
  const isPending = addState.isLoading || removeState.isLoading;

  const img = product.images?.[0] ?? null;
  const rating = demoRating ?? { score: 4.5, count: 1200 };

  const handleHeart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'buyer') return;
    const next = !isLiked;
    setOptimistic(next);
    try {
      if (next) await addToWishlist(product._id).unwrap();
      else await removeFromWishlist(product._id).unwrap();
    } catch {
      setOptimistic(null);
    } finally {
      setTimeout(() => setOptimistic(null), 400);
    }
  };

  const verificationBadge = showVerificationBadge ? getVerificationBadge(product.sq_status) : null;

  return (
    <article className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/browse/${product._id}`} className="block">
        <div className="relative aspect-square bg-surface-alt overflow-hidden">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="w-10 h-10" />
            </div>
          )}

          {/* Verification badge — top-left */}
          {verificationBadge && (
            <span
              className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 h-6 rounded-pill text-[10px] font-bold shadow-xs ${verificationBadge.className}`}
              title={verificationBadge.tooltip}
            >
              <verificationBadge.icon className="w-3 h-3" />
              {verificationBadge.label}
            </span>
          )}

          {/* Heart — top-right */}
          <button
            type="button"
            onClick={handleHeart}
            disabled={isPending}
            aria-label={isLiked ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-pressed={isLiked}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-pill bg-white/90 hover:bg-white border border-border flex items-center justify-center shadow-xs transition-colors disabled:opacity-60"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isLiked ? 'fill-destructive text-destructive' : 'text-muted-foreground'
              }`}
            />
          </button>
        </div>

        <div className="p-3 md:p-3.5">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">
            {product.title}
          </h3>

          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(rating.score)
                      ? 'fill-warning text-warning'
                      : 'fill-surface-muted text-surface-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">({formatCount(rating.count)})</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-foreground">{formatPrice(product.price)}</span>
          </div>
        </div>
      </Link>

      {showQuickAdd && onAddToCart && (
        <div className="px-3 pb-3">
          <button
            onClick={() => onAddToCart(product)}
            className="w-full py-2 bg-accent hover:bg-accent-600 text-accent-foreground rounded-lg text-xs font-semibold transition-colors"
          >
            Add to Cart
          </button>
        </div>
      )}
    </article>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

interface VerificationBadgeInfo {
  label: string;
  icon: React.ElementType;
  className: string;
  tooltip: string;
}

function getVerificationBadge(status: SqStatus): VerificationBadgeInfo {
  switch (status) {
    case 'approved':
      return {
        label: 'Verified',
        icon: ShieldCheck,
        className: 'bg-success-50 text-success-700',
        tooltip: 'SQ-verified by EHB — passed background, compliance and trust scoring.',
      };
    case 'pending':
    case 'pending_franchise':
    case 'pending_edr':
      return {
        label: 'Pending',
        icon: Clock,
        className: 'bg-warning-50 text-warning-500',
        tooltip: 'Under SQ review — verification in progress.',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        icon: ShieldOff,
        className: 'bg-destructive/10 text-destructive',
        tooltip: 'Did not pass SQ verification. Buy at your own discretion.',
      };
    case 'not_submitted':
    default:
      return {
        label: 'Unverified',
        icon: ShieldAlert,
        className: 'bg-surface-muted text-muted-foreground',
        tooltip: 'Seller has not submitted this product for SQ verification yet.',
      };
  }
}
