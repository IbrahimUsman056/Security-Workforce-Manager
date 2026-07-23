import { apiSlice } from '../../api/apiSlice';

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => '/notifications/',
      providesTags: ['Notification'],
    }),
    markAsRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const { useGetNotificationsQuery, useMarkAsReadMutation } = notificationsApi;