import { baseApi } from './base-api';

export type PromoVariant =
  | 'pink' | 'sky' | 'red' | 'green' | 'amber' | 'navy' | 'orange';

export interface HeroSlide {
  id: string;
  eyebrow?: string;
  title: string;
  priceLine?: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  bgGradient: string;
  illustration: 'phone' | 'laptop' | 'fashion';
  /** Optional public-asset image URL (e.g. "/assets/iphone-16-pro-max.png"). */
  image_url?: string;
}

export interface PromoTile {
  id: string;
  variant: PromoVariant;
  subtitle?: string;
  title: string;
  highlight?: string;
  ctaLabel?: string;
  href: string;
  slot: 'mid_row_1' | 'mid_row_2' | 'wide_banner';
  order: number;
}

export interface HomeBannersResponse {
  hero_slides: HeroSlide[];
  promo_tiles: PromoTile[];
}

export interface FeaturedBrand {
  id: string;
  name: string;
  initials: string;
  text_color: string;
  bg_color: string;
  tag: string;
  href?: string;
}

export interface HomeStats {
  sq_verified_pct: number;
  industries_covered: number;
  on_time_delivery_pct: number;
  trusted_buyers_count: number;
  total_products: number;
}

export const homeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getHomeBanners: build.query<HomeBannersResponse, void>({
      query: () => '/home/banners',
    }),
    getFeaturedBrands: build.query<FeaturedBrand[], void>({
      query: () => '/home/featured-brands',
    }),
    getHomeStats: build.query<HomeStats, void>({
      query: () => '/home/stats',
      providesTags: ['HomeStats'],
    }),
  }),
});

export const {
  useGetHomeBannersQuery,
  useGetFeaturedBrandsQuery,
  useGetHomeStatsQuery,
} = homeApi;
