import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_GOSELLR_API_URL ?? 'http://localhost:3002/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Product', 'Auth', 'Seller', 'Rider', 'Cart', 'Order',
    'Wishlist', 'HomeStats', 'DeliveryRequest', 'AvailableRiders',
    'Notification', 'NotificationCount',
  ],
  endpoints: () => ({}),
});
