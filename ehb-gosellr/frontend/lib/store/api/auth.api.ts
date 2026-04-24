import { baseApi } from './base-api';
import type { UserPublic } from '../auth.slice';

interface RegisterBody {
  email: string;
  password: string;
  full_name: string;
  role: 'seller' | 'buyer';
}

interface LoginBody {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  user: UserPublic;
}

interface EhbCallbackBody {
  ehb_token: string;
}

interface ChangePasswordBody {
  /** Omit when setting a password for the first time (EHB-only users) */
  current_password?: string;
  new_password: string;
}

interface ChangePasswordResponse {
  message: string;
}

interface LogoutResponse {
  success: true;
  message: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<AuthResponse, RegisterBody>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: build.mutation<AuthResponse, LoginBody>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    getMe: build.query<UserPublic, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    /** Exchange an EHB token for a GoSellr JWT */
    ehbCallback: build.mutation<AuthResponse, EhbCallbackBody>({
      query: (body) => ({ url: '/auth/ehb-callback', method: 'POST', body }),
    }),
    /** Change or first-time set local GoSellr password */
    changePassword: build.mutation<ChangePasswordResponse, ChangePasswordBody>({
      query: (body) => ({ url: '/auth/change-password', method: 'PATCH', body }),
    }),
    /**
     * Server-side logout — increments token_version in DB so ALL existing
     * GoSellr JWTs for this user are immediately revoked server-side.
     * After calling this, also dispatch the Redux logout() action to clear localStorage.
     */
    logoutServer: build.mutation<LogoutResponse, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useEhbCallbackMutation,
  useChangePasswordMutation,
  useLogoutServerMutation,
} = authApi;
