# GoSellr Landing Page — Functional Wiring Notes

Companion to `MIGRATION_NOTES.md`. Documents the second pass that turned
the redesigned landing page into a fully data-driven, end-to-end functional
storefront wired to new backend endpoints.

## Backend additions

### Products module (extended)
File: `backend/apps/gosellr-api/src/modules/products/`

`GET /products` — added query parameters:
- `q` — free-text search (case-insensitive regex on title + description)
- `sort` — `newest` | `popular` | `price_asc` | `price_desc`
- `seller_id` — filter to a single seller (powers brand-store pages)

`GET /products/categories` — **new.** Returns `{ name, count }[]` of distinct
categories present in approved products, ordered by descending count. Used
by the landing-page Popular Categories carousel.

### Home module (new)
Path: `backend/apps/gosellr-api/src/modules/home/`

| Endpoint | Description |
|---|---|
| `GET /home/banners` | Hero carousel slides + promo tiles. Returns `{ hero_slides[], promo_tiles[] }`. Promo tiles carry a `slot` field (`mid_row_1` \| `mid_row_2` \| `wide_banner`) so the frontend places each tile in the correct row. |
| `GET /home/featured-brands` | List of featured brand stores. Backed by approved sellers when present, otherwise falls back to a curated default list with brand initials, color palette, and 24-hour delivery tag. |
| `GET /home/stats` | Trust-strip values: `sq_verified_pct`, `industries_covered`, `on_time_delivery_pct`, `trusted_buyers_count`, `total_products`. Computed live from MongoDB; constants in `home.constants.ts` are floor values. |

Default banner content lives in `home.constants.ts` so the page works the
moment the API boots — even with an empty database.

### Wishlist module (new)
Path: `backend/apps/gosellr-api/src/modules/wishlist/`

| Endpoint | Description |
|---|---|
| `GET /wishlist` | (auth) Buyer's saved products with full product details. |
| `GET /wishlist/ids` | (auth) Cheap lookup — just the product IDs. Used by the heart toggle on every product card to know its initial state. |
| `POST /wishlist/:productId` | (auth, idempotent) Save a product. Uses Mongo `upsert` so duplicates are no-ops. |
| `DELETE /wishlist/:productId` | (auth) Remove from wishlist. |

Schema: one document per `(user_id, product_id)` pair with a unique compound
index. JWT-protected via the existing `JwtAuthGuard`.

Both modules registered in `app.module.ts`.

## Frontend wiring

### New RTK Query slices

| File | What it exposes |
|---|---|
| `lib/store/api/products.api.ts` (extended) | `useGetProductsQuery` now accepts `q`, `sort`, `seller_id`. New `useGetCategoriesQuery`. New types `ProductSort`, `GetProductsArgs`, `CategoryWithCount`. |
| `lib/store/api/home.api.ts` (new) | `useGetHomeBannersQuery`, `useGetFeaturedBrandsQuery`, `useGetHomeStatsQuery`. |
| `lib/store/api/wishlist.api.ts` (new) | `useGetWishlistQuery`, `useGetWishlistIdsQuery`, `useAddToWishlistMutation`, `useRemoveFromWishlistMutation`. |

`baseApi.tagTypes` extended with `'Wishlist'` and `'HomeStats'`. All endpoints
auto-register via `injectEndpoints`, so no changes needed in `lib/store/index.ts`.

### Component updates (data-driven)

| Component | Now consumes |
|---|---|
| `components/landing/hero-banner.tsx` | `useGetHomeBannersQuery()` — pulls `hero_slides[]`. Renders a single fallback slide while loading; then cross-fades real slides every 6s. |
| `components/landing/popular-categories.tsx` | `useGetCategoriesQuery()` — renders skeleton on load, real categories with chosen icon + tint after. Falls back to a curated default set when the API returns an empty list. |
| `components/landing/brand-stores.tsx` | `useGetFeaturedBrandsQuery()` — 8 skeleton cards while loading, then real brand cards with palette-driven colors. |
| `components/landing/product-card-mini.tsx` | `useGetWishlistIdsQuery()` for initial heart state; `useAddToWishlistMutation()` / `useRemoveFromWishlistMutation()` for toggle. Optimistic updates with revert on error. Unauthenticated users get redirected to `/login` on tap. |

### Landing page (`app/page.tsx`)

Replaced the previous single 20-product fetch with **six targeted queries**:

| Section | Query |
|---|---|
| Today's Best Deals | `useGetProductsQuery({ limit: 5, sort: 'popular' })` |
| 60% Off On Winter Wear | `useGetProductsQuery({ limit: 5, category: 'Clothing', sort: 'price_desc' })` |
| Bestseller In Grocery | `useGetProductsQuery({ limit: 5, category: 'Groceries' })` |
| Bestsellers In Home Appliances | `useGetProductsQuery({ limit: 5, category: 'Home & Garden' })` |
| Style & Fashion | `useGetProductsQuery({ limit: 5, category: 'Clothing' })` |
| New Arrivals | `useGetProductsQuery({ limit: 5, sort: 'newest' })` |

Trust-strip values come from `useGetHomeStatsQuery()`. Promo tile rows are
filtered from `useGetHomeBannersQuery()` by `slot`.

### Browse page (`app/(buyer)/browse/page.tsx`)

Now honors three URL parameters end-to-end: `q`, `category`, `sort`.
- New search bar that submits a query string and updates the URL
- New sort dropdown (Default / Newest / Popular / Price asc/desc)
- Initial state and ongoing changes both push to the URL via `router.push`,
  so back/forward and shareable URLs all work
- "No results" copy adapts when there's an active search query

### Navbar search

The navbar's search pill (top header + mobile-only row) submits a `?q=` URL
param to `/browse`. Since the browse page now honors `q`, the full search
loop works end-to-end.

## Auth/role gating preserved

- Wishlist hooks use `skip: !isBuyer` so non-buyers never trigger the call
- Heart toggle on cards: unauthenticated → `/login`; non-buyer → no-op
- Cart actions: unchanged from earlier pass; still redirect to login when needed
- All new endpoints respect the same JWT/role rules as the existing API

## Verification

- `tsc --noEmit` clean on both `backend` and `frontend`
- All hooks and aliases exported (including legacy `useGetProductByIdQuery`,
  `useGetSQStatusQuery` aliases for backwards compat)
- No business logic, schemas, or migrations changed for existing modules

## Future work (out of scope)

- Admin UI for hero slides + promo tiles + featured brands (currently sourced
  from `home.constants.ts` defaults; the GET endpoints are the read API)
- Real review/rating system to drive `popular` sort and per-product star counts
  (today the popular sort uses `sq_level` as a proxy and stars are placeholder)
- Product impressions/click tracking for "trending" sections
- Wishlist count badge in the navbar (next to cart count)
- Brand-store landing pages at `/browse?seller_id=...`
