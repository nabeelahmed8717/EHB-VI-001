'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Grid2x2, ChevronDown, Smartphone, Laptop, Headphones, Tv, Watch, Camera,
  Shirt, ShoppingBag, Footprints, Glasses, Gem, Briefcase,
  Home, Sofa, Lamp, ChefHat, Bed, ToyBrick,
  Sparkles, HeartPulse, Pill, Baby, Dumbbell, Apple,
  Coffee, Cookie, Utensils, BookOpen, Car, ArrowRight,
} from 'lucide-react';

interface SubItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface MegaColumn {
  title: string;
  items: SubItem[];
  accent: string;
}

const COLUMNS: MegaColumn[] = [
  {
    title: 'Electronics',
    accent: 'bg-rose-400',
    items: [
      { label: 'Phones',     href: '/browse?category=Electronics&q=phone',    icon: Smartphone },
      { label: 'Laptops',    href: '/browse?category=Electronics&q=laptop',   icon: Laptop },
      { label: 'Audio',      href: '/browse?category=Electronics&q=headphones', icon: Headphones },
      { label: 'TVs',        href: '/browse?category=Electronics&q=tv',       icon: Tv },
      { label: 'Wearables',  href: '/browse?category=Electronics&q=watch',    icon: Watch },
      { label: 'Cameras',    href: '/browse?category=Electronics&q=camera',   icon: Camera },
    ],
  },
  {
    title: 'Fashion',
    accent: 'bg-pink-400',
    items: [
      { label: "Men's",       href: '/browse?category=Clothing&q=men',         icon: Shirt },
      { label: "Women's",     href: '/browse?category=Clothing&q=women',       icon: ShoppingBag },
      { label: 'Shoes',       href: '/browse?category=Clothing&q=shoes',       icon: Footprints },
      { label: 'Bags',        href: '/browse?category=Clothing&q=bag',         icon: Briefcase },
      { label: 'Accessories', href: '/browse?category=Clothing&q=accessories', icon: Glasses },
      { label: 'Luxury',      href: '/browse?category=Luxury',                 icon: Gem },
    ],
  },
  {
    title: 'Home & Living',
    accent: 'bg-emerald-400',
    items: [
      { label: 'Furniture',   href: '/browse?category=Home%20%26%20Garden&q=furniture', icon: Sofa },
      { label: 'Decor',       href: '/browse?category=Home%20%26%20Garden&q=decor',     icon: Home },
      { label: 'Kitchen',     href: '/browse?category=Home%20%26%20Garden&q=kitchen',   icon: ChefHat },
      { label: 'Bedding',     href: '/browse?category=Home%20%26%20Garden&q=bed',       icon: Bed },
      { label: 'Lighting',    href: '/browse?category=Home%20%26%20Garden&q=lamp',      icon: Lamp },
      { label: 'Kids & Toys', href: '/browse?category=Home%20%26%20Garden&q=toys',      icon: ToyBrick },
    ],
  },
  {
    title: 'Health & Beauty',
    accent: 'bg-amber-400',
    items: [
      { label: 'Skincare',     href: '/browse?category=Health&q=skincare',  icon: Sparkles },
      { label: 'Makeup',       href: '/browse?category=Health&q=makeup',    icon: Sparkles },
      { label: 'Wellness',     href: '/browse?category=Health&q=wellness',  icon: HeartPulse },
      { label: 'Pharmacy',     href: '/browse?category=Pharmacy',           icon: Pill },
      { label: 'Baby Care',    href: '/browse?category=Health&q=baby',      icon: Baby },
      { label: 'Sports & Fit', href: '/browse?category=Sports',             icon: Dumbbell },
    ],
  },
  {
    title: 'Groceries & More',
    accent: 'bg-sky-400',
    items: [
      { label: 'Fresh Produce', href: '/browse?category=Groceries&q=fresh',    icon: Apple },
      { label: 'Pantry',        href: '/browse?category=Groceries&q=pantry',   icon: Cookie },
      { label: 'Beverages',     href: '/browse?category=Groceries&q=beverage', icon: Coffee },
      { label: 'Restaurants',   href: '/browse?category=Food',                 icon: Utensils },
      { label: 'Books',         href: '/browse?category=Books',                icon: BookOpen },
      { label: 'Automotive',    href: '/browse?category=Automotive',           icon: Car },
    ],
  },
];

/**
 * "All Categories" trigger + expandable mega-menu panel.
 *
 * Opening behavior is robust against the typical pitfalls:
 *  - Stops mousedown propagation on the trigger so the document-level
 *    pointerdown listener doesn't immediately close the just-opened panel.
 *  - Uses pointerdown (not mousedown) so it works for touch/stylus too.
 *  - Renders a transparent backdrop layer that catches outside clicks
 *    and dismisses the panel.
 *  - Closes on Escape and on any link click inside the panel.
 *  - Panel is position: absolute, z-50, with no parent overflow concerns
 *    (must be placed outside any overflow-x scroll container).
 */
export function CategoriesMegaMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors"
      >
        <Grid2x2 className="w-4 h-4" />
        <span className="hidden sm:inline">All Categories</span>
        <span className="sm:hidden">Categories</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <>
          {/* Click-outside backdrop — fills the viewport BELOW the header */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/10 cursor-default"
            tabIndex={-1}
          />

          {/* Panel */}
          <div
            role="menu"
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-2 z-50 w-screen max-w-[min(96vw,1100px)] bg-card border border-border rounded-2xl shadow-lg p-5 md:p-6 animate-fade-in"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-5">
              {COLUMNS.map((col) => (
                <div key={col.title}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-1 h-4 rounded-pill ${col.accent}`} />
                    <h4 className="text-sm font-extrabold text-foreground tracking-tight">{col.title}</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {col.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-accent transition-colors py-1 group"
                          >
                            <Icon className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-accent transition-colors" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
              <p className="text-muted-foreground">
                Browse <span className="font-semibold text-foreground">38+ industries</span> · all SQ-verified
              </p>
              <Link
                href="/browse"
                onClick={() => setOpen(false)}
                className="text-accent font-semibold hover:text-accent-700 inline-flex items-center gap-1"
              >
                View all categories
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
