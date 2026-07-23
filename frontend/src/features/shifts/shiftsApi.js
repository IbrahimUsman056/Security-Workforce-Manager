import { apiSlice } from '../../api/apiSlice';

export const shiftsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getShifts: builder.query({
      query: ({ siteId, startDate, endDate, page = 1, pageSize = 50 } = {}) => {
        const params = new URLSearchParams();
        if (siteId) params.append('site_id', siteId);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        params.append('page', page);
        params.append('page_size', pageSize);
        return `/shifts/?${params.toString()}`;
      },
      providesTags: ['Shift'],
    }),
    createShift: builder.mutation({
      query: (data) => ({ url: '/shifts/', method: 'POST', body: data }),
      invalidatesTags: ['Shift'],
    }),
    deleteShift: builder.mutation({
      query: (id) => ({ url: `/shifts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Shift'],
    }),
    getSuggestedStaff: builder.query({
      query: (shiftId) => `/shifts/${shiftId}/suggested-staff`,
    }),
  }),
});

export const {
  useGetShiftsQuery, useCreateShiftMutation, useDeleteShiftMutation, useGetSuggestedStaffQuery,
} = shiftsApi;