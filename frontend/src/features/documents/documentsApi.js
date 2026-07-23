import { apiSlice } from '../../api/apiSlice';

export const documentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyDocuments: builder.query({
      query: () => '/staff-documents/me',
      providesTags: ['Document'],
    }),
    getUserDocuments: builder.query({
      query: (userId) => `/staff-documents/${userId}`,
      providesTags: ['Document'],
    }),
    uploadDocument: builder.mutation({
      query: (formData) => ({ url: '/staff-documents/', method: 'POST', body: formData }),
      invalidatesTags: ['Document'],
    }),
    deleteDocument: builder.mutation({
      query: (id) => ({ url: `/staff-documents/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Document'],
    }),
  }),
});

export const {
  useGetMyDocumentsQuery, useGetUserDocumentsQuery, useUploadDocumentMutation, useDeleteDocumentMutation,
} = documentsApi;