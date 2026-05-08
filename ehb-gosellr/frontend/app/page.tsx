'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { Navbar } from '@/components/layout/navbar';
import { useGetProductsQuery, type Product } from '@/lib/store/api/products.api';
import { useAddToCartMutation } from '@/lib/store/api/orders.api';
import { useGetHomeBannersQuery, useGetHomeStatsQuery } from '@/lib/store/api/home.api';
import { HeroBanner } from '@/components/landing/hero-banner';
import { PopularCategories } from '@/components/landing/popular-categories';
import { ProductRow } from '@/components/landing/product-row';
import { ProductCardMini } from '@/components/landing/product-card-mini';
import { SectionHeader } from '@/components/landing/section-header';
import { PromoTile } from '@/components/landing/promo-tile';
import { BrandStores } from '@/components/landing/brand-stores';
import { SiteFooter } from '@/components/landing/site-footer';
import {
  ShieldCheck, Truck, BadgeCheck, Sparkles, Package, ChevronRight, Info,
} from 'lucide-react';

/**
 * GoSellr landing page — fully data-driven.
 *
 * The "All Products" section uses status='all' so it surfaces every active
 * product on the marketplace, regardless of SQ verification state. Each card
 * shows a small badge (Verified / Pending / Unverified / Rejected) so buyers
 * can tell at a glance which products are SQ-trusted.
 *
 * Themed rows above (popular, grocery, fashion, etc.) keep the default
 * approved-only filter so featured surfaces only show vetted items.
 */
export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  // Themed rows — verified products only, by category/sort
  const popular        = useGetProductsQuery({ limit: 5, page: 1, sort: 'popular' });
  const groceries      = useGetProductsQuery({ limit: 5, page: 1, category: 'Groceries' });
  const homeAppliances = useGetProductsQuery({ limit: 5, page: 1, category: 'Home & Garden' });
  const fashion        = useGetProductsQuery({ limit: 5, page: 1, category: 'Clothing' });
  const winter         = useGetProductsQuery({ limit: 5, page: 1, category: 'Clothing', sort: 'price_desc' });

  // "All Products" — every active product including pending/unverified
  const [allPage, setAllPage] = useState(1);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const ALL_PAGE_SIZE = 24;
  const all = useGetProductsQuery({
    limit: ALL_PAGE_SIZE,
    page: allPage,
    sort: 'newest',
    status: verifiedOnly ? 'approved' : 'all',
  });
  const allProducts = all.data?.data ?? [];
  const allTotal = all.data?.total ?? 0;
  const totalPages = all.data?.total_pages ?? 1;

  const banners = useGetHomeBannersQuery();
  const stats   = useGetHomeStatsQuery();
  const [addToCart] = useAddToCartMutation();

  const promoMidRow1 = (banners.data?.promo_tiles ?? []).filter(t => t.slot === 'mid_row_1').sort((a, b) => a.order - b.order);
  const promoMidRow2 = (banners.data?.promo_tiles ?? []).filter(t => t.slot === 'mid_row_2').sort((a, b) => a.order - b.order);
  const promoWide    = (banners.data?.promo_tiles ?? []).filter(t => t.slot === 'wide_banner').sort((a, b) => a.order - b.order)[0];

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'buyer') {
      router.push(user?.role === 'seller' ? '/dashboard' : '/dashboard/rider');
      return;
    }
    try {
      await addToCart({
        product_id: product._id,
        product_name: product.title,
        product_image_url: product.images[0] ?? undefined,
        unit_price: product.price,
        quantity: 1,
      }).unwrap();
      router.push('/cart');
    } catch {
      alert('Could not add to cart. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pb-12">
        <HeroBanner />

        {/* Trust strip */}
        <section className="max-w-[1320px] mx-auto px-4 md:px-6 mt-6 md:mt-8">
          <div className="bg-card border border-border rounded-xl px-4 md:px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 shadow-card">
            <TrustItem icon={ShieldCheck} label="SQ-Verified Sellers"
              value={stats.data ? `${stats.data.sq_verified_pct}%` : '100%'} loading={stats.isLoading} />
            <TrustItem icon={BadgeCheck} label="Industries Covered"
              value={stats.data ? `${stats.data.industries_covered}+` : '38+'} loading={stats.isLoading} />
            <TrustItem icon={Truck} label="On-time Delivery"
              value={stats.data ? `${stats.data.on_time_delivery_pct}%` : '98.4%'} loading={stats.isLoading} />
            <TrustItem icon={Sparkles} label="Trusted by Buyers"
              value={stats.data ? formatBigNumber(stats.data.trusted_buyers_count) : '50k+'} loading={stats.isLoading} />
          </div>
        </section>

        <PopularCategories />

        <ProductRow
          title="Today's Best Deals For You"
          viewAllHref="/browse?deals=1"
          products={popular.data?.data ?? []}
          isLoading={popular.isLoading}
          onAddToCart={handleAddToCart}
          emptyMessage="Featured deals are on the way."
        />

        {promoMidRow1.length > 0 && (
          <section className="max-w-[1320px] mx-auto px-4 md:px-6 mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {promoMidRow1.map((t) => (
              <PromoTile key={t.id} variant={t.variant} subtitle={t.subtitle} title={t.title}
                highlight={t.highlight} ctaLabel={t.ctaLabel} href={t.href} />
            ))}
          </section>
        )}

        <ProductRow
          title="60% Off Or More On Winter Wear"
          viewAllHref="/browse?category=Clothing"
          products={winter.data?.data ?? []}
          isLoading={winter.isLoading}
          onAddToCart={handleAddToCart}
          emptyMessage="Winter collection coming soon."
        />

        <BrandStores />

        {promoMidRow2.length > 0 && (
          <section className="max-w-[1320px] mx-auto px-4 md:px-6 mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {promoMidRow2.map((t) => (
              <PromoTile key={t.id} variant={t.variant} subtitle={t.subtitle} title={t.title}
                highlight={t.highlight} ctaLabel={t.ctaLabel} href={t.href} />
            ))}
          </section>
        )}

        <ProductRow
          title="Bestseller In Grocery"
          viewAllHref="/browse?category=Groceries"
          products={groceries.data?.data ?? []}
          isLoading={groceries.isLoading}
          onAddToCart={handleAddToCart}
          emptyMessage="Grocery bestsellers coming soon."
        />

        <ProductRow
          title="Bestsellers In Home Appliances"
          viewAllHref="/browse?category=Home%20%26%20Garden"
          products={homeAppliances.data?.data ?? []}
          isLoading={homeAppliances.isLoading}
          onAddToCart={handleAddToCart}
          emptyMessage="Home appliance bestsellers coming soon."
        />

        {promoWide && (
          <section className="max-w-[1320px] mx-auto px-4 md:px-6 mt-10 md:mt-12">
            <PromoTile variant={promoWide.variant} subtitle={promoWide.subtitle}
              title={promoWide.title} highlight={promoWide.highlight}
              ctaLabel={promoWide.ctaLabel} href={promoWide.href} size="lg" />
          </section>
        )}

        <ProductRow
          title="Style & Fashion"
          viewAllHref="/browse?category=Clothing"
          products={fashion.data?.data ?? []}
          isLoading={fashion.isLoading}
          onAddToCart={handleAddToCart}
          emptyMessage="Fashion picks coming soon."
        />

        {/* All Products — every active product, including pending verification */}
        <section className="max-w-[1320px] mx-auto px-4 md:px-6 mt-10 md:mt-12">
          <SectionHeader
            title={allTotal > 0 ? `All Products (${allTotal.toLocaleString()})` : 'All Products'}
            subtitle={
              verifiedOnly
                ? 'Showing SQ-verified products only'
                : 'Every product on GoSellr — verified and pending'
            }
            viewAllHref="/browse"
            viewAllLabel="Open browse"
          />

          {/* Verified-only toggle */}
          <div className="flex items-center justify-between mb-4 -mt-1 flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => { setVerifiedOnly(e.target.checked); setAllPage(1); }}
                className="rounded border-border text-accent focus:ring-ring"
              />
              <span>Show SQ-verified only</span>
            </label>
            {!verifiedOnly && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Some items are still pending verification — buy at your discretion.
              </p>
            )}
          </div>

          {all.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-square bg-surface-alt animate-pulse-soft" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-surface-alt rounded animate-pulse-soft" />
                    <div className="h-3 bg-surface-alt rounded w-2/3 animate-pulse-soft" />
                    <div className="h-4 bg-surface-alt rounded w-1/2 animate-pulse-soft" />
                  </div>
                </div>
              ))}
            </div>
          ) : allProducts.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                {verifiedOnly
                  ? 'No SQ-verified products yet.'
                  : 'No active products in the catalog yet.'}
              </p>
              <p className="text-xs mt-1 opacity-70">
                {verifiedOnly
                  ? 'Try unchecking the verified-only filter to see pending products.'
                  : 'When sellers add products, they will show up here immediately.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {allProducts.map((p) => (
                  <ProductCardMini
                    key={p._id}
                    product={p}
                    onAddToCart={handleAddToCart}
                    showVerificationBadge
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setAllPage((p) => Math.max(1, p - 1))}
                    disabled={allPage === 1}
                    className="px-4 h-9 rounded-pill border border-border text-sm font-semibold text-foreground hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{allPage}</span> of {totalPages}
                  </span>
                  <button
                    onClick={() => setAllPage((p) => Math.min(totalPages, p + 1))}
                    disabled={allPage >= totalPages}
                    className="px-4 h-9 rounded-pill border border-border text-sm font-semibold text-foreground hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <a href="/browse" className="ml-1 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-700">
                    Open full browse
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </>
          )}
        </section>

        {!isAuthenticated && (
          <section className="max-w-[1320px] mx-auto px-4 md:px-6 mt-12 md:mt-16">
            <div className="bg-gradient-hero rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)] pointer-events-none" />
              <div className="relative">
                <h2 className="text-2xl md:text-4xl font-extrabold mb-3">Ready to grow with GoSellr?</h2>
                <p className="text-primary-100 max-w-xl mx-auto mb-6 text-sm md:text-base">
                  Join verified sellers and riders building Pakistan&apos;s most trusted marketplace.
                  Complete your SQ verification and start reaching millions.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <a href="/register" className="inline-flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-pill font-semibold text-sm hover:bg-white/95 transition-colors">Become a Seller</a>
                  <a href="/register" className="inline-flex items-center gap-2 border border-white/40 text-white px-5 py-2.5 rounded-pill font-semibold text-sm hover:bg-white/10 transition-colors">Earn as a Rider</a>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function TrustItem({
  icon: Icon, label, value, loading,
}: { icon: React.ElementType; label: string; value: string; loading?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-pill bg-accent-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div className="min-w-0">
        <div className="text-base font-extrabold text-foreground">
          {loading ? <span className="inline-block w-12 h-4 bg-surface-alt rounded animate-pulse-soft" /> : value}
        </div>
        <div className="text-xs text-muted-foreground truncate">{label}</div>
      </div>
    </div>
  );
}

function formatBigNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}k+`;
  return String(n);
}
