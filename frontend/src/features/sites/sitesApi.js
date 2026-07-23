import { apiSlice } from '../../api/apiSlice';

export const sitesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSites: builder.query({
      query: () => '/sites/',
      providesTags: ['Site'],
    }),
    createSite: builder.mutation({
      query: (data) => ({ url: '/sites/', method: 'POST', body: data }),
      invalidatesTags: ['Site'],
    }),
    deleteSite: builder.mutation({
      query: (id) => ({ url: `/sites/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Site'],
    }),
    updateSite: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/sites/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Site'],
    }),
  }),
});

export const { useGetSitesQuery, useCreateSiteMutation, useDeleteSiteMutation, useUpdateSiteMutation } = sitesApi;