import { apiSlice } from '../../api/apiSlice';

export const profileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query({
      query: () => '/staff-profiles/me',
      providesTags: ['Profile'],
    }),
    upsertProfile: builder.mutation({
      query: (formData) => ({ url: '/staff-profiles/', method: 'POST', body: formData }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const { useGetMyProfileQuery, useUpsertProfileMutation } = profileApi;