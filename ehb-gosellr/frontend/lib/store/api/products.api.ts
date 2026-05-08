import { baseApi } from './base-api';

export type SqStatus =
  | 'not_submitted'
  | 'pending'
  | 'pending_franchise'
  | 'pending_edr'
  | 'approved'
  | 'rejected';

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
