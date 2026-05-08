'use client';

import Link from 'next/link';
import { Store } from 'lucide-react';
import { SectionHeader } from './section-header';
import { useGetFeaturedBrandsQuery } from '@/lib/store/api/home.api';

const SKELETON_COUNT = 8;

export function BrandStores() {
  const { data, isLoading } = useGetFeaturedBrandsQuery();
  const brands = data ?? [];

  return (
    <section className="max-w-[1320px] mx-auto px-4 md:px-6 mt-10 md:mt-14">
      <SectionHeader title="Explore Official Brand Stores" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-surface-alt animate-pulse-soft" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-surface-alt rounded animate-pulse-soft" />
                  <div className="h-2.5 bg-surface-alt rounded w-3/4 animate-pulse-soft" />
                </div>
              </div>
            ))
          : brands.map((s) => (
              <Link
                key={s.id}
                href={s.href ?? `/browse?brand=${encodeURIComponent(s.name)}`}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:shadow-card hover:border-accent/30 transition-all"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${s.bg_color}`}>
                  <span className={`text-sm font-extrabold ${s.text_color}`}>{s.initials}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-foreground leading-tight truncate">{s.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <Store className="w-3 h-3" />
                    {s.tag}
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
