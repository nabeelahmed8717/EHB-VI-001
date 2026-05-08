import { baseApi } from './base-api';

export interface RiderProfile {
  id: string;
  user_id: string;
  cnic: string;
  vehicle_type: 'bike' | 'motorcycle' | 'car' | 'van' | 'truck';
  license_plate: string;
  availability_zone: string;
  availability: 'online' | 'offline' | 'on_delivery';
  cnic_front_url: string | null;
  cnic_back_url: string | null;
  vehicle_photo_url: string | null;
  driving_license_url: string | null;
  document_urls: string[];
  sq_status: string;
  sq_level: number | null;
  sq_badge_label: string | null;
  is_active: boolean;
}

interface CreateRiderProfileBody {
  cnic: string;
  vehicle_type: 'bike' | 'motorcycle' | 'car' | 'van' | 'truck';
  license_plate: string;
  availability_zone: string;
}

interface UpdateRiderProfileBody {
  vehicle_type?: string;
  license_plate?: string;
  availability_zone?: string;
  cnic_front_url?: string;
  cnic_back_url?: string;
  vehicle_photo_url?: string;
  driving_license_url?: string;
  document_urls?: string[];
}

interface SetAvailabilityBody {
  availability: 'online' | 'offline' | 'on_delivery';
}

export const riderApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    registerRider: build.mutation<RiderProfile, CreateRiderProfileBody>({
      query: (body) => ({ url: '/rider/register', method: 'POST', body }),
      invalidatesTags: ['Rider'],
    }),
    getRiderProfile: build.query<RiderProfile | null, void>({
      query: () => '/rider/profile',
      providesTags: ['Rider'],
    }),
    updateRiderProfile: build.mutation<RiderProfile, UpdateRiderProfileBody>({
      query: (body) => ({ url: '/rider/profile', method: 'PATCH', body }),
      invalidatesTags: ['Rider'],
    }),
    setRiderAvailability: build.mutation<{ availability: string }, SetAvailabilityBody>({
      query: (body) => ({ url: '/rider/availability', method: 'PATCH', body }),
      invalidatesTags: ['Rider'],
    }),
    getRiderStats: build.query<{ sq_status: string; sq_level: number | null; sq_badge_label: string | null; availability: string; is_active: boolean }, void>({
      query: () => '/rider/stats',
      providesTags: ['Rider'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterRiderMutation,
  useGetRiderProfileQuery,
  useUpdateRiderProfileMutation,
  useSetRiderAvailabilityMutation,
  useGetRiderStatsQuery,
} = riderApi;
