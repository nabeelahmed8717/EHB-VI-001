'use client';

import Link from 'next/link';
import { useRef } from 'react';
import {
  Headphones, Shirt, Gem, Home, Sparkles, Apple, Dumbbell, Heart,
  Pill, Baby, BookOpen, Car, Gift, Watch, Camera, Coffee,
  ChevronRight, ChevronLeft,
} from 'lucide-react';
import { SectionHeader } from './section-header';
import { useGetCategoriesQuery } from '@/lib/store/api/products.api';

interface VisualCategory {
  name: string;
  href: string;
  icon: React.ElementType;
  tint: string;
  count?: number;
}

/**
 * Master list of categories to render in the carousel. Each carries its own
 * icon + tint pairing so the carousel stays visually consistent regardless
 * of how many products exist in the DB. Counts from /products/categories
 * are merged in at runtime — categories with real products are sorted to
 * the front, the rest fill the carousel as discovery surfaces.
 */
const MASTER_CATEGORIES: VisualCategory[] = [
  { name: 'Electronics',     href: '/browse?category=Electronics',    icon: Headphones, tint: 'from-pink-100 to-rose-100' },
  { name: 'Fashion',         href: '/browse?category=Clothing',       icon: Shirt,      tint: 'from-rose-100 to-orange-100' },
  { name: 'Luxury',          href: '/browse?category=Luxury',         icon: Gem,        tint: 'from-pink-50 to-fuchsia-100' },
  { name: 'Home & Garden',   href: '/browse?category=Home%20%26%20Garden', icon: Home,   tint: 'from-emerald-50 to-teal-100' },
  { name: 'Health & Beauty', href: '/browse?category=Health',         icon: Sparkles,   tint: 'from-amber-50 to-yellow-100' },
  { name: 'Groceries',       href: '/browse?category=Groceries',      icon: Apple,      tint: 'from-lime-50 to-emerald-100' },
  { name: 'Sports',          href: '/browse?category=Sports',         icon: Dumbbell,   tint: 'from-sky-50 to-blue-100' },
  { name: 'Wellness',        href: '/browse?category=Wellness',       icon: Heart,      tint: 'from-rose-50 to-pink-100' },
  { name: 'Pharmacy',        href: '/browse?category=Pharmacy',       icon: Pill,       tint: 'from-red-50 to-rose-100' },
  { name: 'Kids',            href: '/browse?category=Kids',           icon: Baby,       tint: 'from-yellow-50 to-amber-100' },
  { name: 'Books',           href: '/browse?category=Books',          icon: BookOpen,   tint: 'from-violet-50 to-purple-100' },
  { name: 'Automotive',      href: '/browse?category=Automotive',     icon: Car,        tint: 'from-slate-100 to-zinc-100' },
  { name: 'Gifts',           href: '/browse?category=Gifts',          icon: Gift,       tint: 'from-fuchsia-50 to-pink-100' },
  { name: 'Watches',         href: '/browse?category=Watches',        icon: Watch,      tint: 'from-stone-100 to-amber-100' },
  { name: 'Cameras',         href: '/browse?category=Cameras',        icon: Camera,     tint: 'from-cyan-50 to-sky-100' },
  { name: 'Food & Drinks',   href: '/browse?category=Food',           icon: Coffee,     tint: 'from-orange-50 to-amber-100' },
];

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/** Find a master entry whose name matches an API-returned category. */
function findMaster(apiName: string): VisualCategory | undefined {
  const n = normalize(apiName);
  return MASTER_CATEGORIES.find((c) => {
    if (normalize(c.name) === n) return true;
    // alias matches: "Clothing" → Fashion, "Home" → Home & Garden, "Health" → Health & Beauty
    if (n === 'clothing' && c.name === 'Fashion') return true;
    if (n === 'home' && c.name === 'Home & Garden') return true;
    if (n === 'health' && c.name === 'Health & Beauty') return true;
    return false;
  });
}

export function PopularCategories() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useGetCategoriesQuery();

  /* Merge live counts onto the master list and sort:
     1. Categories with real products first (highest count first)
     2. Remaining master categories filling the carousel
     This guarantees the user always sees 11+ tiles even on a fresh DB. */
  const liveCountByName = new Map<string, number>();
  (data ?? []).forEach((c) => {
    const m = findMaster(c.name);
    if (m) {
      const prev = liveCountByName.get(m.name) ?? 0;
      liveCountByName.set(m.name, prev + c.count);
    }
  });

  const enriched = MASTER_CATEGORIES.map((c) => ({
    ...c,
    count: liveCountByName.get(c.name),
  }));

  // Sort: ones with counts first (descending), then rest in master order
  const withCounts = enriched.filter((c) => (c.count ?? 0) > 0).sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const withoutCounts = enriched.filter((c) => !c.count || c.count === 0);
  const categories = [...withCounts, ...withoutCounts];

  const scroll = (dir: 'left' | 'right') => {
    if (!trackRef.current) return;
    const amount = trackRef.current.clientWidth * 0.6;
    trackRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="max-w-[1320px] mx-auto px-4 md:px-6 mt-10 md:mt-12">
      <SectionHeader title="Explore Popular Categories" viewAllHref="/browse" />

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-pill bg-card border border-border shadow-card items-center justify-center hover:bg-surface-alt"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div ref={trackRef} className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
          {isLoading
            ? Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-24 md:w-28">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-pill bg-surface-alt animate-pulse-soft" />
                  <div className="h-3 w-20 bg-surface-alt rounded animate-pulse-soft" />
                </div>
              ))
            : categories.map((cat) => {
                const Icon = cat.icon;
                const hasProducts = (cat.count ?? 0) > 0;
                return (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    className="group flex flex-col items-center gap-2 shrink-0 w-24 md:w-28"
                  >
                    <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-pill bg-gradient-to-br ${cat.tint} flex items-center justify-center shadow-xs group-hover:shadow-md transition-shadow`}>
                      <Icon className="w-8 h-8 md:w-9 md:h-9 text-primary" />
                      {hasProducts && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-pill bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                          {cat.count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs md:text-sm font-medium text-foreground text-center">{cat.name}</span>
                  </Link>
                );
              })}
        </div>

        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-pill bg-card border border-border shadow-card items-center justify-center hover:bg-surface-alt"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
