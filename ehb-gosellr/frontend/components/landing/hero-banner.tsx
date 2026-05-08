'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Smartphone } from 'lucide-react';
import { useGetHomeBannersQuery, type HeroSlide } from '@/lib/store/api/home.api';

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'fallback-1',
    eyebrow: 'New arrival',
    title: 'iPhone 16 Pro Max',
    priceLine: 'From $1,199*',
    description: 'A18 chip. Superfast. Supersmart. SQ-verified by GoSellr.',
    ctaLabel: 'Shop Now',
    ctaHref: '/browse?category=Electronics',
    bgGradient: 'from-primary-900 via-primary-800 to-primary-600',
    illustration: 'phone',
    image_url: '/assets/iphone-16-pro-max.png',
  },
  {
    id: 'fallback-2',
    eyebrow: 'Trending',
    title: 'Smart Living, Smart Savings',
    priceLine: 'Up to 40% off',
    description: 'Premium electronics from verified sellers — laptops, headphones, smart-home devices.',
    ctaLabel: 'Explore Deals',
    ctaHref: '/browse',
    bgGradient: 'from-primary-800 via-accent-700 to-accent-500',
    illustration: 'laptop',
    image_url: '/assets/premium-electronics.png',
  },
  {
    id: 'fallback-3',
    eyebrow: 'New season',
    title: 'Style That Speaks',
    priceLine: 'Up to 60% off',
    description: 'Discover the latest fashion drops — exclusively from SQ-verified brand stores.',
    ctaLabel: 'Shop Fashion',
    ctaHref: '/browse?category=Clothing',
    bgGradient: 'from-primary-900 via-accent-600 to-accent-400',
    illustration: 'fashion',
    image_url: '/assets/banner-shoe.png',
  },
];

/**
 * Hero block: 2-column layout — main carousel banner + side promo.
 * Slides fetched from /home/banners; falls back to a single slide while loading.
 */
export function HeroBanner() {
  const { data } = useGetHomeBannersQuery();
  const slides = data?.hero_slides && data.hero_slides.length > 0 ? data.hero_slides : FALLBACK_SLIDES;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  // Reset index when slides set changes (e.g. when API resolves)
  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [slides.length, active]);

  return (
    <section className="max-w-[1320px] mx-auto px-4 md:px-6 mt-4 md:mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <div className="md:col-span-2 relative rounded-2xl overflow-hidden h-64 md:h-[340px] lg:h-[380px]">
          {slides.map((slide, i) => (
            <article
              key={slide.id}
              aria-hidden={active !== i}
              className={`absolute inset-0 transition-opacity duration-500 ease-out
                bg-gradient-to-br ${slide.bgGradient}
                ${active === i ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              {/* Full-card image */}
              {slide.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:flex items-center justify-center">
                  <HeroIllustration kind={slide.illustration} />
                </div>
              )}

              {/* Readability overlay — darker on the left where the text sits */}
              {slide.image_url && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10"
                  aria-hidden="true"
                />
              )}

              {/* Text content over the image */}
              <div className="relative h-full flex items-center">
                <div className="px-6 md:px-10 lg:px-14 max-w-[60%] z-10 drop-shadow-md">
                  {slide.eyebrow && (
                    <span className="inline-block text-xs md:text-sm font-semibold text-white/90 mb-2 uppercase tracking-wider">
                      {slide.eyebrow}
                    </span>
                  )}
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-2 md:mb-3 drop-shadow-lg">
                    {slide.title}
                  </h1>
                  {slide.priceLine && (
                    <p className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3 drop-shadow-lg">
                      {slide.priceLine}
                    </p>
                  )}
                  <p className="hidden md:block text-sm lg:text-md text-white/95 mb-5 max-w-md leading-relaxed drop-shadow-md">
                    {slide.description}
                  </p>
                  <Link href={slide.ctaHref}>
                    <button className="inline-flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-pill font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg">
                      {slide.ctaLabel}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-pill transition-all duration-300 ${
                    active === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <Link
          href="/browse?category=Sports"
          className="rounded-2xl overflow-hidden bg-gradient-to-br from-accent-500 via-accent-400 to-accent-300 h-64 md:h-[340px] lg:h-[380px] relative group"
        >
          <div className="absolute inset-0 p-6 md:p-7 flex flex-col justify-between">
            <div>
              <span className="inline-block text-[10px] md:text-xs font-semibold uppercase tracking-wider text-white/90 mb-1.5">
                Limited offer
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">SALE</h3>
              <p className="text-white/95 font-bold text-3xl md:text-4xl mt-1">UP TO<br />50% OFF</p>
            </div>
            <div className="text-xs md:text-sm text-white/90 font-medium">
              Sneakers · Activewear · Gear
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/15 blur-2xl group-hover:bg-white/25 transition-colors" />
          <div className="absolute top-8 right-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        </Link>
      </div>
    </section>
  );
}

function HeroIllustration({ kind }: { kind: HeroSlide['illustration'] }) {
  if (kind === 'phone') {
    return (
      <div className="relative w-64 h-64 lg:w-80 lg:h-80">
        <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 lg:w-40 h-56 lg:h-72 bg-gradient-to-br from-white/40 to-white/10 rounded-3xl border border-white/30 backdrop-blur-sm flex items-center justify-center">
          <Smartphone className="w-16 h-16 text-white/80" />
        </div>
      </div>
    );
  }
  return (
    <div className="relative w-64 h-64 lg:w-80 lg:h-80">
      <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute inset-8 rounded-3xl bg-white/15 border border-white/30" />
      <div className="absolute inset-16 rounded-2xl bg-white/20" />
    </div>
  );
}
