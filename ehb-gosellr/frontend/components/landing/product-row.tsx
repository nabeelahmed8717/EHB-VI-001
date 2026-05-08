'use client';

import { ProductCardMini } from './product-card-mini';
import { SectionHeader } from './section-header';
import { Package } from 'lucide-react';
import type { Product } from '@/lib/store/api/products.api';

interface ProductRowProps {
  title: string;
  viewAllHref?: string;
  products: Product[];
  isLoading?: boolean;
  onAddToCart?: (product: Product) => void;
  /** Layout: "grid" (responsive 2/3/4/5 col) or "scroll" (horizontal) */
  layout?: 'grid' | 'scroll';
  /** Demo ratings to use when product has none */
  demoRatings?: { score: number; count: number }[];
  /** Number of skeleton cards while loading */
  skeletonCount?: number;
  /** Empty-state message override */
  emptyMessage?: string;
  /** How many products to render at most */
  limit?: number;
}

const FALLBACK_RATINGS = [
  { score: 4.5, count: 1200 },
  { score: 3.0, count: 569 },
  { score: 4.0, count: 100 },
  { score: 4.5, count: 1100 },
  { score: 4.0, count: 157 },
  { score: 3.5, count: 26 },
  { score: 4.5, count: 451 },
  { score: 4.0, count: 33 },
];

export function ProductRow({
  title,
  viewAllHref,
  products,
  isLoading = false,
  onAddToCart,
  layout = 'grid',
  demoRatings = FALLBACK_RATINGS,
  skeletonCount = 5,
  emptyMessage = 'No products to show right now.',
  limit = 5,
}: ProductRowProps) {
  const shown = products.slice(0, limit);

  return (
    <section className="max-w-[1320px] mx-auto px-4 md:px-6 mt-10 md:mt-12">
      <SectionHeader title={title} viewAllHref={viewAllHref} />

      {isLoading ? (
        <SkeletonRow count={skeletonCount} layout={layout} />
      ) : shown.length === 0 ? (
        <EmptyRow message={emptyMessage} />
      ) : layout === 'scroll' ? (
        <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
          {shown.map((p, i) => (
            <div key={p._id} className="shrink-0 w-44 md:w-52">
              <ProductCardMini
                product={p}
                onAddToCart={onAddToCart}
                demoRating={demoRatings[i % demoRatings.length]}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {shown.map((p, i) => (
            <ProductCardMini
              key={p._id}
              product={p}
              onAddToCart={onAddToCart}
              demoRating={demoRatings[i % demoRatings.length]}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SkeletonRow({ count, layout }: { count: number; layout: 'grid' | 'scroll' }) {
  if (layout === 'scroll') {
    return (
      <div className="flex gap-3 md:gap-4 overflow-hidden pb-2">
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shrink-0 w-full md:w-auto md:min-w-44">
      <div className="aspect-square bg-surface-alt animate-pulse-soft" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-surface-alt rounded animate-pulse-soft" />
        <div className="h-3 bg-surface-alt rounded w-2/3 animate-pulse-soft" />
        <div className="h-4 bg-surface-alt rounded w-1/2 animate-pulse-soft" />
      </div>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground">
      <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-1 opacity-70">Check back soon as sellers get their products SQ-approved.</p>
    </div>
  );
}
