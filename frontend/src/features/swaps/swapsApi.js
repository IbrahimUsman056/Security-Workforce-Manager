import { apiSlice } from '../../api/apiSlice';

export const swapsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMySwaps: builder.query({
      query: () => '/swaps/my-requests',
      providesTags: ['Swap'],
    }),
    getAllSwaps: builder.query({
      query: () => '/swaps/',
      providesTags: ['Swap'],
    }),
    requestSwap: builder.mutation({
      query: (data) => ({ url: '/swaps/', method: 'POST', body: data }),
      invalidatesTags: ['Swap'],
    }),
    updateSwapStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/swaps/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Swap', 'Assignment'],
    }),
  }),
});

export const {
  useGetMySwapsQuery, useGetAllSwapsQuery, useRequestSwapMutation, useUpdateSwapStatusMutation,
} = swapsApi;