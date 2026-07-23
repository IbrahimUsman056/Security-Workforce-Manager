import { apiSlice } from '../../api/apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    registerOrg: builder.mutation({
      query: (data) => ({
        url: '/organizations/register',
        method: 'POST',
        body: data,
      }),
    }),
    joinOrg: builder.mutation({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    getMe: builder.query({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
  }),
});

export const { useLoginMutation, useRegisterOrgMutation, useJoinOrgMutation, useGetMeQuery } = authApi;