# GoSellr UI Redesign — Reference Image Analysis

This document records the design tokens extracted from the **emox** reference image and how they were translated into GoSellr's centralized theme. Where the reference's visual choices conflicted with GoSellr's brand identity, the GoSellr-aligned token is documented in the right column.

## 1. Composition & layout

The reference is a classic multi-vendor marketplace home page composed of stacked, full-width sections, each with a left-aligned title and a right-aligned "View All →" link. The page has roughly nine major bands stacked vertically with consistent padding:

1. **Top utility / search header** — single sticky row containing the wordmark, a wide rounded search pill with a blue "submit" button, location selector ("Delivering to Dubai → Update Location"), country flag, cart, and sign-in.
2. **Category navigation row** — `All Categories` dropdown (with a 4-dot grid icon), eight horizontal category links, then `Best Deals` and `emox Live` on the far right.
3. **Hero block** — a 2/3 width auto-rotating banner carousel + a 1/3 width promo card. The carousel has 3 slide indicators (dots) at the bottom-center. Decorative phone illustration sits on the right of the navy slide.
4. **"Explore Popular Categories"** — a horizontally-scrolling row of round tinted thumbnails (Electronics, Fashion, Luxury, Home Decor, Health & Beauty, Groceries, Sneakers).
5. **"Today's Best Deals For You"** — a 5-up row of product cards, each with a heart-toggle, image, 2-line title, star rating + count, AED price.
6. **Mid-promo banner row** — 3 vivid banner cards in a row (pink "Vegetables 50% off", sky blue "Galaxy S24 FE", red "Pantry / offer").
7. **"Explore Official Brand Stores"** — a 4×2 grid of small white cards, each with a brand logo and a "Delivery within 24 hours" tag.
8. **Bestseller rows** — repeating `ProductRow` sections for Grocery, Home Appliances, Style & Fashion.
9. **Wide festival banner + footer** — a large Arabic green Ramadan promo card, followed by the footer.

The reference relies on heavy whitespace, large rounded corners (16-24px), soft shadows (almost imperceptible), and bright editorial color blocks for the promo banners. The result is a clean editorial feel rather than a busy "marketplace wall."

## 2. Color palette

| Reference role | Reference value (sampled) | GoSellr token | GoSellr value |
|---|---|---|---|
| Background | `#FFFFFF` | `--background` | `#FAFBFC` (220 30 98) |
| Subtle alt panel | `#F5F7FA` | `--surface-alt` | `#F1F4F8` (220 30 96) |
| Brand wordmark / dark hero | `#0E1B33` (deep navy) | `--primary` | `#0B1E3D` (219 71 14) |
| Action / search button | `#1F6FEB` (bright blue) | `--accent` | `#1F6FEB` (215 84 52) |
| Star rating | `#FFC107` (amber) | `warning-400` | `#FFC926` |
| Sale / red tag | `#E32636` | `--destructive` | `#EF4444` (0 84 60) |
| Trust / verified green | n/a in reference (used in GoSellr SQ badges) | `success-600` | `#16A34A` |
| Body text | `#0F172A` | `--foreground` | `#0F172A` (222 47 11) |
| Secondary text | `#64748B` | `--muted-foreground` | `#64748B` (215 16 47) |
| Border | `#E2E8F0` | `--border` | `#E2E8F0` (220 16 90) |

Promo banner gradients were built as variants in `PromoTile` (pink, sky, red, green, amber, navy, orange) so themed banners can be composed without re-deriving colors per page.

## 3. Typography

The reference uses a single neutral sans-serif (likely SF Pro / Inter / Plus Jakarta Sans) with a tight tracking. Three weights are observable: 400 body, 600 product titles & nav, 800 hero headlines.

GoSellr keeps the existing **Inter** font (loaded via `next/font/google` in `app/layout.tsx`) but adds a deliberate scale in `lib/theme.ts → typography.fontSize`:

```
xxs 10/14 · xs 12/16 · sm 13/18 · base 14/20 · md 15/22
lg 16/24 · xl 18/26 · 2xl 20/28 · 3xl 24/32 · 4xl 28/36
5xl 32/40 · 6xl 40/48 · 7xl 52/60
```

This mirrors the reference's hero (~32-40px), section titles (~20px), card titles (~14px) and microcopy (~11-12px).

## 4. Spacing & rhythm

The reference works on a 4px grid with characteristic 16/24/40/48px steps between sections. GoSellr's `theme.spacing` matches this exactly. The recurring outer container width is **1320px** (matches `max-w-[1320px]` adopted in the new layout), with horizontal padding of 16px on mobile and 24px on tablet+.

Vertical rhythm between sections: `mt-10` on mobile, `mt-12` on desktop (40px / 48px), implemented by reusable `<SectionHeader>` and the per-section `<section>` wrappers.

## 5. Border radius

| Element | Reference radius | Token |
|---|---|---|
| Search pill, chips, primary CTAs | full pill | `rounded-pill` |
| Product cards, promo tiles, section cards | ~14-16px | `rounded-xl` (= `var(--radius)` = 14px) |
| Banner cards, hero | ~20-24px | `rounded-2xl` |
| Tiny tags / status pills | full | `rounded-pill` |

## 6. Shadows

Shadows are deliberately faint in the reference — closer to a 2px ambient halo than a Material elevation. `theme.shadows.card` = `0 2px 8px rgba(15,23,42,0.06)` is the standard surface shadow, with `shadow-md` (`0 4px 12px / 0.08`) reserved for hover.

## 7. Component patterns extracted

| Reference pattern | New GoSellr component |
|---|---|
| Top search header w/ wordmark, search pill, location, cart, sign-in | `components/layout/navbar.tsx` (rebuilt) |
| Secondary categories row with `All Categories` + horizontal links | included in `navbar.tsx` secondary row |
| Hero banner carousel + side promo | `components/landing/hero-banner.tsx` |
| Round-thumbnail category carousel | `components/landing/popular-categories.tsx` |
| Compact product card with heart, rating, price | `components/landing/product-card-mini.tsx` |
| Section title row + "View All →" link | `components/landing/section-header.tsx` |
| Themed promo banners (color variants) | `components/landing/promo-tile.tsx` |
| Brand-store grid card | `components/landing/brand-stores.tsx` |
| 4-column footer with wordmark + columns + bottom legal | `components/landing/site-footer.tsx` |
| Reusable ProductRow (grid or scroll) with skeleton/empty states | `components/landing/product-row.tsx` |

## 8. Adaptations from the reference

The user explicitly chose to keep GoSellr branding and adapt the reference style to GoSellr context. Notable adaptations:

- **Wordmark**: kept the name "GoSellr" but rendered it in the lowercase + dotted style of the emox wordmark for visual parity.
- **Currency**: kept GoSellr's existing `formatPrice()` PKR formatter rather than the reference's AED.
- **Banners**: replaced the reference's literal product photography (iPhone 16, vegetables, Galaxy S24 FE, Ramadan basket) with abstract gradient + decorative shape illustrations so the marketing is brand-agnostic and renders without external asset dependencies.
- **Localization banners**: the reference's right-to-left Arabic banners were dropped per the user's "match style, adapt to GoSellr context" choice. The wide festival banner is generic English instead.
- **Trust strip**: a new band added below the hero that surfaces GoSellr's SQ trust signals (SQ-Verified, Industries Covered, On-time Delivery, Trusted Buyers) — these don't exist in the reference but were preserved from the previous landing page so business value isn't lost.
- **Auth-aware seller/rider CTA**: unauthenticated users see a navy gradient CTA inviting them to sell or ride. Authenticated users see no such block. This logic is preserved end-to-end.

## 9. Theme architecture decision

Per the user's selection, the source of truth is **`tailwind.config.ts` + CSS variables**:

- `lib/theme.ts` exports a typed `theme` object — colors, type, spacing, radius, shadows, breakpoints, animation. This is the canonical token store.
- `tailwind.config.ts` imports from `lib/theme.ts` and feeds the values into Tailwind.
- `app/globals.css` mirrors the brand-relevant tokens as HSL CSS variables (`--background`, `--primary`, `--accent`, etc.) so a future dark mode or white-label theme swap is a CSS-only change.
- Components reference tokens via Tailwind utility classes (`bg-primary`, `text-accent`, `rounded-xl`, `shadow-card`) rather than hard-coded hex values.

To rebrand: edit `lib/theme.ts` for type/scale changes and `app/globals.css` `:root` for color swaps. All modules update automatically.
