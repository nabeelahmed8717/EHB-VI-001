import { baseApi } from './base-api';
import type { Product } from './products.api';

interface WishlistResponse {
  data: Product[];
  total: number;
}

interface WishlistIdsResponse {
  data: string[];
}

interface WishlistMutationResponse {
  ok: boolean;
  product_id: string;
}

export const wishlistApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWishlist: build.query<WishlistResponse, void>({
      query: () => '/wishlist',
      providesTags: ['Wishlist'],
    }),
    getWishlistIds: build.query<WishlistIdsResponse, void>({
      query: () => '/wishlist/ids',
      providesTags: ['Wishlist'],
    }),
    addToWishlist: build.mutation<WishlistMutationResponse, string>({
      query: (productId) => ({
        url: `/wishlist/${productId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Wishlist'],
    }),
    removeFromWishlist: build.mutation<WishlistMutationResponse, string>({
      query: (productId) => ({
        url: `/wishlist/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useGetWishlistIdsQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} = wishlistApi;
