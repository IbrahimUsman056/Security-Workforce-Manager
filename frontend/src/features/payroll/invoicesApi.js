import { apiSlice } from '../../api/apiSlice';

export const invoicesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: () => '/invoices/',
      providesTags: ['Invoice'],
    }),
    createInvoice: builder.mutation({
      query: (data) => ({ url: '/invoices/', method: 'POST', body: data }),
      invalidatesTags: ['Invoice'],
    }),
    updateInvoiceStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/invoices/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Invoice'],
    }),
  }),
});

export const { useGetInvoicesQuery, useCreateInvoiceMutation, useUpdateInvoiceStatusMutation } = invoicesApi;