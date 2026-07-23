import { apiSlice } from '../../api/apiSlice';

export const templatesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTemplates: builder.query({
      query: () => '/shift-templates/',
      providesTags: ['Template'],
    }),
    createTemplate: builder.mutation({
      query: (data) => ({ url: '/shift-templates/', method: 'POST', body: data }),
      invalidatesTags: ['Template'],
    }),
    generateShifts: builder.mutation({
      query: (id) => ({ url: `/shift-templates/${id}/generate`, method: 'POST' }),
      invalidatesTags: ['Shift'],
    }),
    deleteTemplate: builder.mutation({
      query: (id) => ({ url: `/shift-templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Template'],
    }),
  }),
});

export const {
  useGetTemplatesQuery, useCreateTemplateMutation, useGenerateShiftsMutation, useDeleteTemplateMutation,
} = templatesApi;