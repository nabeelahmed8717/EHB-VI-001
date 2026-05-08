import { baseApi } from './base-api';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'ready_for_delivery'
  | 'picked'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note: string | null;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  rider_id: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  status_history: StatusHistoryEntry[];
  delivery_address: {
    address_line: string;
    city: string;
    area: string;
    lat: number | null;
    lng: number | null;
  };
  buyer_notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  total: number;
}

interface CreateOrderBody {
  seller_id: string;
  items: OrderItem[];
  delivery_address: {
    address_line: string;
    city: string;
    area: string;
    lat?: number;
    lng?: number;
  };
  delivery_fee?: number;
  buyer_notes?: string;
}

interface UpdateStatusBody {
  status: OrderStatus;
  note?: string;
}

interface AddToCartBody {
  product_id: string;
  product_name: string;
  product_image_url?: string;
  unit_price: number;
  quantity: number;
}

interface UpdateCartItemBody { quantity: number; }

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Cart ──────────────────────────────────────────────────────────────
    getCart: build.query<Cart, void>({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),
    addToCart: build.mutation<Cart, AddToCartBody>({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: build.mutation<Cart, { productId: string; quantity: number }>({
      query: ({ productId, quantity }) => ({
        url: `/cart/items/${productId}`,
        method: 'PATCH',
        body: { quantity } as UpdateCartItemBody,
      }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: build.mutation<Cart, string>({
      query: (productId) => ({ url: `/cart/items/${productId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: build.mutation<{ message: string }, void>({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    // ── Orders ────────────────────────────────────────────────────────────
    createOrder: build.mutation<Order, CreateOrderBody>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Order', 'Cart'],
    }),
    getMyOrders: build.query<Order[], void>({
      query: () => '/orders/my',
      providesTags: ['Order'],
    }),
    getAvailableOrders: build.query<Order[], void>({
      query: () => '/orders/available',
      providesTags: ['Order'],
    }),
    getOrder: build.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    updateOrderStatus: build.mutation<Order, { id: string } & UpdateStatusBody>({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, 'Order'],
    }),
    assignRider: build.mutation<Order, { id: string; rider_id: string }>({
      query: ({ id, rider_id }) => ({
        url: `/orders/${id}/assign-rider`,
        method: 'PATCH',
        body: { rider_id },
      }),
      invalidatesTags: ['Order'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetAvailableOrdersQuery,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useAssignRiderMutation,
} = ordersApi;
