import { baseApi } from './base-api';

interface AuthUser {
  id: string;
  ehb_user_id: string;
  email: string;
  full_name: string;
}

interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Exchange an EHB token for a JPS JWT */
    ehbCallback: build.mutation<AuthResponse, { ehb_token: string }>({
      query: (body) => ({ url: '/auth/callback', method: 'POST', body }),
    }),
    getMe: build.query<AuthUser, void>({
      query: () => '/auth/me',
    }),
    logout: build.mutation<{ success: true }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useEhbCallbackMutation,
  useGetMeQuery,
  useLogoutMutation,
} = authApi;
