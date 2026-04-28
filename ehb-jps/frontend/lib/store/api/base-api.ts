import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_JPS_API_URL ?? 'http://localhost:3006'}`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.access_token
        ?? (typeof window !== 'undefined' ? sessionStorage.getItem('jps_token') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Profile'],
  endpoints: () => ({}),
});
