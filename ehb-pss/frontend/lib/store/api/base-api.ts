import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';

export const baseApi = createApi({
  reducerPath: 'pssApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_PSS_API_URL ?? 'http://localhost:3001',
    prepareHeaders: async (headers) => {
      // Use the admin key from next-auth session or env fallback
      const session = await getSession();
      const adminKey =
        (session as { adminKey?: string } | null)?.adminKey ??
        process.env.NEXT_PUBLIC_EHB_ADMIN_KEY ??
        '';
      if (adminKey) {
        headers.set('x-ehb-admin-key', adminKey);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'SqRequest',
    'SqRecord',
    'EdrReview',
    'Franchise',
    'FranchiseReview',
    'PlatformRule',
    'CriteriaSet',
    'Platform',
    'AuditLog',
    'WebhookDelivery',
    'Stats',
  ],
  endpoints: () => ({}),
});
