# GoSellr UI Redesign — Migration Notes

This document records every visual change made during the redesign. **No business logic, API contracts, state management, routing, or backend behavior was modified.** The work is strictly UI / theming.

## Theme system (new)

| File | Purpose |
|---|---|
| `lib/theme.ts` | **New.** Single source of truth for design tokens — colors (primary/accent/warning/success/destructive/neutral), typography, spacing, radii, shadows, breakpoints, animations. Exports a typed `theme` object plus a `semanticColors` helper. |
| `tailwind.config.ts` | **Replaced.** Now imports from `lib/theme.ts` and exposes brand color scales (primary 50-900, accent 50-700, warning, success), font scales, radii, shadows, gradients, and a few new keyframes (`fade-in`, `slide-up`, `pulse-soft`). |
| `app/globals.css` | **Replaced.** New CSS variables in `:root` and `.dark` matching the new token model (navy primary, bright blue accent, warm neutrals). Adds `.no-scrollbar`, `.focus-ring`, `.section-title`, `.surface-card`, `.chip` utility helpers. |

**To rebrand later**: change values in `lib/theme.ts` and the matching HSL triplets in `app/globals.css`. Components don't need to change.

## Landing page (rebuilt)

| File | Status | What changed |
|---|---|---|
| `app/page.tsx` | **Replaced.** | Was a green-themed marketplace pitch; now an emox-style storefront composed of `HeroBanner`, `PopularCategories`, four `ProductRow` sections, three rows of `PromoTile` banners, `BrandStores`, a wide festival banner, and an auth-gated seller/rider CTA. Existing logic preserved: `useGetProductsQuery`, `useAddToCartMutation`, auth redirect to `/login` for unauthenticated users, role-based redirect for sellers/riders. |

### New landing components (all under `components/landing/`)

| File | Description |
|---|---|
| `section-header.tsx` | Reusable section title row — `<h2>` + optional "View All →" link. |
| `hero-banner.tsx` | Auto-rotating 3-slide hero carousel + side promo card. Slides cross-fade every 6s; dots clickable. |
| `popular-categories.tsx` | Horizontal-scroll round-thumbnail category carousel with prev/next arrows on desktop. |
| `product-card-mini.tsx` | Compact reference-style product card: image + heart toggle, 2-line title, star rating with count, price, optional Add-to-Cart pill. |
| `product-row.tsx` | Wraps a section header + grid (or scroll) of `ProductCardMini`s, with skeleton/empty/loading states. Used 4× on the landing page. |
| `promo-tile.tsx` | Themeable colorful banner card with seven gradient variants (pink, sky, red, green, amber, navy, orange). Used by mid-page promo rows + festival banner. |
| `brand-stores.tsx` | 2×4 grid of brand store cards with initials avatar + 24-hour delivery tag. |
| `site-footer.tsx` | New 4-column footer with the GoSellr wordmark, link columns (Products / Help / Sell / Company), contact line, and copyright row. |

## Shared layout (restyled)

| File | Status | What changed |
|---|---|---|
| `components/layout/navbar.tsx` | **Replaced.** | New 3-row sticky header matching the reference: primary row (wordmark · search pill · location · cart · sign-in/account menu), optional mobile search row, secondary categories row. Account dropdown now uses semantic theme tokens. All existing role-based links and cart-count logic preserved. |
| `components/layout/seller-sidebar.tsx` | _Untouched_ | Already used theme tokens. |
| `components/product/product-card.tsx` | **Restyled.** | Now uses `bg-surface-alt`, `border-border`, `text-foreground`. Adds hover scale on the image. Logic identical. |

## UI primitives

| File | Status | What changed |
|---|---|---|
| `components/ui/button.tsx` | **Restyled.** | Default variant now uses `bg-accent` (bright blue) instead of `bg-primary` (which is now navy). Added a new `primary` variant for navy CTAs. Added a `pill` size variant. All existing variants/props preserved. |
| `components/ui/card.tsx` | _Untouched_ — inherits theme via CSS vars |
| `components/ui/badge.tsx` | _Untouched_ |
| `components/ui/input.tsx` | _Untouched_ |
| `components/ui/select.tsx` | _Untouched_ |
| `components/ui/skeleton.tsx` | _Untouched_ |
| `components/ui/toaster.tsx` | _Untouched_ |

## Module pages — visual-only updates

All pages below have **only Tailwind class changes** — no functional code, hooks, props, mutations, or routes were modified. The bulk of the work was a semantic find/replace from hardcoded grays / blues / greens / yellows to theme tokens (`bg-card`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-accent`, `bg-success-50/text-success-700`, etc.).

### Buyer

| File | Visual change |
|---|---|
| `app/(buyer)/layout.tsx` | Added `bg-surface-alt` + `max-w-[1320px]` container width. |
| `app/(buyer)/cart/page.tsx` | Theme tokens applied; price renders via `formatPrice`; CTA changed to `bg-accent` pill. |
| `app/(buyer)/checkout/page.tsx` | Theme tokens applied; inputs use `border-border`, `focus:ring-ring`; CTA `bg-accent` pill; `formatPrice` import added. |
| `app/(buyer)/orders/page.tsx` | Tabs now use `border-accent`/`text-accent`; status badges use the new semantic palette; live-delivery banner uses `bg-warning-50`. Adds `Truck`, `Package`, `MapPin` icons + `formatPrice` import. |
| `app/(buyer)/orders/[id]/page.tsx` | Bulk theme-token swap (gray → semantic, blue → accent, green → success). |
| `app/(buyer)/browse/page.tsx` | Bulk theme-token swap. |
| `app/(buyer)/browse/[id]/page.tsx` | Bulk theme-token swap. |
| `app/(buyer)/settings/page.tsx` | Bulk theme-token swap. |

### Seller

| File | Visual change |
|---|---|
| `app/(seller)/layout.tsx` | Sidebar restyled with `bg-card` / `border-border`, active link uses `bg-accent/10 text-accent`, brand row links to `/`. |
| `app/(seller)/dashboard/page.tsx` | Status pills mapped to new color tokens. Stat cards use `shadow-card`. |
| `app/(seller)/dashboard/orders/page.tsx` | Filter tabs use `bg-accent` for active state, theme tokens elsewhere. |
| `app/(seller)/dashboard/products/page.tsx` | Bulk theme-token swap. |
| `app/(seller)/dashboard/products/[id]/page.tsx` | Bulk theme-token swap. |
| `app/(seller)/dashboard/products/new/page.tsx` | Bulk theme-token swap. |
| `app/(seller)/dashboard/sq-status/page.tsx` | Status header uses `bg-success-100` / `bg-destructive/10` / `bg-warning-50` based on state. |
| `app/(seller)/dashboard/settings/page.tsx` | Bulk theme-token swap. |

### Rider

| File | Visual change |
|---|---|
| `app/(rider)/layout.tsx` | Sidebar restyled the same way as seller. |
| `app/(rider)/dashboard/rider/page.tsx` | "Online" toggle uses `bg-success-50/text-success-700`; stat cards use `shadow-card`. |
| `app/(rider)/dashboard/rider/available/page.tsx` | Bulk theme-token swap. |
| `app/(rider)/dashboard/rider/active/page.tsx` | Bulk theme-token swap. |
| `app/(rider)/register/page.tsx` | Bulk theme-token swap. |

### Auth

| File | Visual change |
|---|---|
| `app/(auth)/login/page.tsx` | EHB CTA now uses `variant="primary"` (navy) per new Button variants; logo wrapped in `bg-accent/10` circle; background `bg-surface-alt`. |
| `app/(auth)/register/page.tsx` | Wordmark redrawn in dotted style; role buttons use `border-border` with hover state `border-accent / bg-accent-50`; icons replace emoji. |
| `app/(auth)/register/buyer/page.tsx` | Bulk theme-token swap. |
| `app/(auth)/seller/register/page.tsx` | Bulk theme-token swap. |
| `app/(auth)/rider/register/page.tsx` | Bulk theme-token swap. |
| `app/(auth)/callback/page.tsx` | Bulk theme-token swap. |

## Token usage guidelines

Going forward, when adding or modifying UI:

- **Backgrounds**: prefer `bg-background` (page), `bg-card` (surfaces), `bg-surface-alt` (subtle panels), `bg-surface-muted` (deeper panels). Avoid `bg-white` or `bg-gray-*`.
- **Text**: `text-foreground` (primary), `text-muted-foreground` (secondary), `text-accent` (links / brand action), `text-primary` (navy headlines / wordmark).
- **Borders**: always `border-border` (or `divide-border` for lists). Never `border-gray-*`.
- **CTAs**:
  - Default action: `bg-accent text-accent-foreground hover:bg-accent-600` (or just use the `<Button>` default variant).
  - Brand CTA (navy): `<Button variant="primary">` or manual `bg-primary text-primary-foreground`.
  - Pill shape: `rounded-pill` or `<Button size="pill">`.
- **Status colors** (use sparingly, for badges only):
  - Pending → `bg-warning-100 text-warning-500`
  - Confirmed → `bg-accent-50 text-accent`
  - Picked / In progress → `bg-primary-100 text-primary-700`
  - Out for delivery → `bg-warning-50 text-warning-500`
  - Delivered / Success → `bg-success-50 text-success-700`
  - Cancelled / Error → `bg-destructive/10 text-destructive`
- **Shadows**: `shadow-card` for resting surfaces, `shadow-md` for hover.
- **Radii**: `rounded-xl` for cards (= `var(--radius)`), `rounded-2xl` for hero/banner blocks, `rounded-pill` for chips/CTAs/avatars.
- **Spacing**: stick to the 4px grid (Tailwind defaults `gap-1, 2, 3, 4, 6, 8, 10, 12`).

## What was preserved end-to-end

- **All Redux slices** (`auth`, `api/*`)
- **All RTK Query hooks** (`useGetProductsQuery`, `useAddToCartMutation`, `useGetMyOrdersQuery`, `useUpdateOrderStatusMutation`, etc.)
- **All routes** (App Router groups `(auth)`, `(buyer)`, `(seller)`, `(rider)` unchanged)
- **All form logic** (login, register, checkout, product creation, address forms)
- **All auth redirects** (unauthenticated → `/login`, role mismatches → respective dashboards)
- **Backend API endpoints** (no changes)
- **Type definitions** (`Product`, `Order`, `OrderStatus`, etc.)
- **EHB SSO flow** (Login with EHB → callback → setCredentials)
- **WebSocket order tracking** (where used in `orders/[id]`)
- **SQ verification flow** (badges, status pills, timeline still wired to the same data)

## Known follow-ups (out of scope for this pass)

- Replace remaining emoji icons in deep flows (e.g. inside SQ timeline detail) with Lucide icons.
- Add a real dark-mode toggle (the CSS vars are ready in `globals.css → .dark`).
- Wire `Sparkles` AI search affordance to a real query suggestion endpoint.
- Plug the "All Categories" dropdown in `Navbar` into a real category tree (currently visual only).
- Add light/dark logo variants for true theme parity.
