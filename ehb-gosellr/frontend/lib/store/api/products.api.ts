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

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<PaginatedProducts, { category?: string; page?: number; limit?: number }>({
      query: ({ category, page = 1, limit = 20 }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (category) params.set('category', category);
        return `/products?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [...result.data.map(({ _id }) => ({ type: 'Product' as const, id: _id })), 'Product']
          : ['Product'],
    }),

    getMyProducts: build.query<PaginatedProducts, { page?: number; limit?: number } | void>({
      query: (args) => {
        const { page = 1, limit = 20 } = args ?? {};
        return `/products/my?page=${page}&limit=${limit}`;
      },
      providesTags: ['Product'],
    }),

    getProductById: build.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Product', id }],
    }),

    createProduct: build.mutation<Product, CreateProductBody>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Product'],
    }),

    updateProduct: build.mutation<Product, { id: string; body: UpdateProductBody }>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Product', id }],
    }),

    submitForSQ: build.mutation<SubmitSqResponse, string>({
      query: (id) => ({ url: `/products/${id}/submit-sq`, method: 'POST' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Product', id }],
    }),

    getSQStatus: build.query<{ product_sq_status: SqStatus; pss_status: unknown }, string>({
      query: (id) => `/products/${id}/sq-status`,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useGetMyProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useSubmitForSQMutation,
  useGetSQStatusQuery,
} = productsApi;
