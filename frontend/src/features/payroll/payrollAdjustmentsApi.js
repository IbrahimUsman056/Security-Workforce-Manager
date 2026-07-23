import { apiSlice } from '../../api/apiSlice';

export const payrollAdjustmentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdjustments: builder.query({
      query: () => '/payroll-adjustments/',
      providesTags: ['Adjustment'],
    }),
    createAdjustment: builder.mutation({
      query: (data) => ({ url: '/payroll-adjustments/', method: 'POST', body: data }),
      invalidatesTags: ['Adjustment'],
    }),
    deleteAdjustment: builder.mutation({
      query: (id) => ({ url: `/payroll-adjustments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Adjustment'],
    }),
  }),
});

export const { useGetAdjustmentsQuery, useCreateAdjustmentMutation, useDeleteAdjustmentMutation } = payrollAdjustmentsApi;