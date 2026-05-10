import { baseApi } from './base-api';

export type SqStatus =
  | 'not_submitted'
  | 'pending'
  | 'pending_franchise'
  | 'pending_edr'
  | 'approved'
  | 'rejected';

/**
 * Buyer-safe view of the GoSellr seller's store, hydrated on product reads.
 * This is the BUSINESS profile (business_name, category) — distinct from the
 * JPS owner profile (the human's identity card).
 */
export interface ProductStore {
  business_name: string;
  business_category: string;
  business_type: string;
  store_description: string;
  store_logo_url: string | null;
  sq_status: string;
  sq_level: number | null;
  sq_badge_label: string | null;
}

/** Compact store summary for product list cards. */
export interface ProductStoreSummary {
  business_name: string;
  business_category: string;
  sq_badge_label: string | null;
  sq_status: string;
}

/**
 * Buyer-safe view of the JPS profile linked to a product's seller.
 * Hydrated server-side by the GoSellr backend on every product read.
 */
export interface ProductOwner {
  id: string;
  platform: string;
  role: string;
  display_name: string;
  bio: string;
  description: string;
  status: string;
  sq_level: number | null;
  sq_badge_label: string | null;
  is_verified: boolean;
}

/** Compact owner summary for product list cards. */
export interface ProductOwnerSummary {
  id: string;
  display_name: string;
  sq_badge_label: string | null;
  is_verified: boolean;
}

export interface Product {
  _id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  is_active: boolean;
  sq_level: number | null;
  sq_status: SqStatus;
  sq_request_id: string | null;
  sq_decided_at: string | null;
  sq_rejection_reason: string | null;
  sq_badge_label: string | null;
  created_at: string;
  updated_at: string;
  /** GoSellr store — present on GET /products/:id only */
  store?: ProductStore | null;
  /** Compact store summary — present on GET /products list only */
  store_summary?: ProductStoreSummary | null;
  /** Full JPS owner profile — present on GET /products/:id only */
  owner?: ProductOwner | null;
  /** Compact JPS owner summary — present on GET /products list only */
  owner_summary?: ProductOwnerSummary | null;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateProductBody {
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
}

export interface UpdateProductBody {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  images?: string[];
  stock?: number;
  is_active?: boolean;
}

export interface SubmitSqResponse {
  sq_request_id: string | null;
  status: string;
  message: string;
}

export type ProductSort = 'newest' | 'popular' | 'price_asc' | 'price_desc';
export type ProductStatusFilter = 'approved' | 'all';

export interface GetProductsArgs {
  category?: string;
  page?: number;
  limit?: number;
  q?: string;
  sort?: ProductSort;
  seller_id?: string;
  /**
   * 'approved' (default) — only SQ-verified products
   * 'all'                — every active product, including pending verification
   */
  status?: ProductStatusFilter;
}

export interface CategoryWithCount {
  name: string;
  count: number;
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<PaginatedProducts, GetProductsArgs>({
      query: ({ category, page = 1, limit = 20, q, sort, seller_id, status } = {}) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (category) params.set('category', category);
        if (q && q.trim()) params.set('q', q.trim());
        if (sort) params.set('sort', sort);
        if (seller_id) params.set('seller_id', seller_id);
        if (status) params.set('status', status);
        return `/products?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [...result.data.map(({ _id }) => ({ type: 'Product' as const, id: _id })), 'Product']
          : ['Product'],
    }),

    getCategories: build.query<CategoryWithCount[], void>({
      query: () => '/products/categories',
      providesTags: ['Product'],
    }),

    getProduct: build.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Product', id }],
    }),

    getMyProducts: build.query<PaginatedProducts, { page?: number; limit?: number } | void>({
      query: (args) => {
        const { page = 1, limit = 20 } = args ?? {};
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        return `/products/my?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [...result.data.map(({ _id }) => ({ type: 'Product' as const, id: _id })), 'Product']
          : ['Product'],
    }),

    createProduct: build.mutation<Product, CreateProductBody>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Product'],
    }),

    updateProduct: build.mutation<Product, { id: string; body: UpdateProductBody }>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Product', id }, 'Product'],
    }),

    submitForSQ: build.mutation<SubmitSqResponse, string>({
      query: (id) => ({ url: `/products/${id}/submit-sq`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Product', id }, 'Product'],
    }),

    getSqStatus: build.query<unknown, string>({
      query: (id) => `/products/${id}/sq-status`,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetProductQuery,
  useGetMyProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useSubmitForSQMutation,
  useGetSqStatusQuery,
} = productsApi;

// Backwards-compatible aliases for legacy call sites that used the older names.
export const useGetProductByIdQuery = productsApi.useGetProductQuery;
export const useGetSQStatusQuery = productsApi.useGetSqStatusQuery;
