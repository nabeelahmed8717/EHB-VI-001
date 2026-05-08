import { baseApi } from './base-api';
import type { UserPublic } from '../auth.slice';

interface RegisterBody {
  email: string;
  password: string;
  full_name: string;
  role: 'seller' | 'buyer' | 'rider';
  phone?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  user: UserPublic;
}

interface RegisterResponse {
  message: string;
  user: UserPublic;
}

interface OtpSendBody { email: string; }
interface OtpVerifyBody { email: string; otp: string; }
interface MessageResponse { message: string; }

interface EhbCallbackBody { ehb_token: string; }
interface ChangePasswordBody { current_password?: string; new_password: string; }
interface LogoutResponse { success: true; message: string; }
interface SwitchRoleBody { role: 'buyer' | 'seller' | 'rider'; }

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<RegisterResponse, RegisterBody>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    sendOtp: build.mutation<MessageResponse, OtpSendBody>({
      query: (body) => ({ url: '/auth/otp/send', method: 'POST', body }),
    }),
    verifyOtp: build.mutation<AuthResponse, OtpVerifyBody>({
      query: (body) => ({ url: '/auth/otp/verify', method: 'POST', body }),
    }),
    login: build.mutation<AuthResponse, LoginBody>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    getMe: build.query<UserPublic, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    ehbCallback: build.mutation<AuthResponse, EhbCallbackBody>({
      query: (body) => ({ url: '/auth/ehb-callback', method: 'POST', body }),
    }),
    changePassword: build.mutation<MessageResponse, ChangePasswordBody>({
      query: (body) => ({ url: '/auth/change-password', method: 'PATCH', body }),
    }),
    logoutServer: build.mutation<LogoutResponse, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    switchRole: build.mutation<AuthResponse, SwitchRoleBody>({
      query: (body) => ({ url: '/auth/switch-role', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useRegisterMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useLoginMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useEhbCallbackMutation,
  useChangePasswordMutation,
  useLogoutServerMutation,
  useSwitchRoleMutation,
} = authApi;
