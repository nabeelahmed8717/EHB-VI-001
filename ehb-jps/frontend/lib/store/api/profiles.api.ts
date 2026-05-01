import { baseApi } from './base-api';
import type { IProfile } from '../../../types/jps.types';

interface PaginatedProfiles {
  profiles: IProfile[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

interface CreateProfileBody {
  platform: string;
  role: string;
  display_name: string;
  bio?: string;
  description?: string;
  cnic_front?: string;
  cnic_back?: string;
  address?: string;
  address_proof?: string;
}

interface UpdateProfileBody {
  display_name?: string;
  bio?: string;
  description?: string;
  cnic_front?: string;
  cnic_back?: string;
  address?: string;
  address_proof?: string;
}

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProfiles: build.query<
      PaginatedProfiles,
      { page?: number; limit?: number; search?: string; role?: string; status?: string }
    >({
      query: ({ page = 1, limit = 20, search, role, status } = {}) => {
        const p = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) p.set('search', search);
        if (role) p.set('role', role);
        if (status) p.set('status', status);
        return `/profiles?${p.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.profiles.map((p) => ({ type: 'Profile' as const, id: p._id })),
              { type: 'Profile', id: 'LIST' },
            ]
          : [{ type: 'Profile', id: 'LIST' }],
    }),

    getProfile: build.query<IProfile, string>({
      query: (id) => `/profiles/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Profile', id }],
    }),

    createProfile: build.mutation<IProfile, CreateProfileBody>({
      query: (body) => ({ url: '/profiles', method: 'POST', body }),
      invalidatesTags: [{ type: 'Profile', id: 'LIST' }],
    }),

    updateProfile: build.mutation<IProfile, { id: string; body: UpdateProfileBody }>({
      query: ({ id, body }) => ({ url: `/profiles/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Profile' as const, id },
        { type: 'Profile' as const, id: 'LIST' },
      ],
    }),

    submitProfile: build.mutation<IProfile, string>({
      query: (id) => ({ url: `/profiles/${id}/submit`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Profile', id },
        { type: 'Profile', id: 'LIST' },
      ],
    }),

    deleteProfile: build.mutation<void, string>({
      query: (id) => ({ url: `/profiles/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Profile', id },
        { type: 'Profile', id: 'LIST' },
      ],
    }),

    uploadImage: build.mutation<{ url: string }, FormData>({
      query: (formData) => ({
        url: '/uploads/image',
        method: 'POST',
        body: formData,
        // RTK Query: don't set Content-Type — browser sets it with boundary for multipart
        formData: true,
      }),
    }),
  }),
});

export const {
  useGetProfilesQuery,
  useGetProfileQuery,
  useCreateProfileMutation,
  useUpdateProfileMutation,
  useSubmitProfileMutation,
  useDeleteProfileMutation,
  useUploadImageMutation,
} = profilesApi;
