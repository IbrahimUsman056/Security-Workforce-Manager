import { apiSlice } from '../../api/apiSlice';

export const assignmentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAssignments: builder.query({
      query: (shiftId) => `/shift-assignments/?shift_id=${shiftId}`,
      providesTags: ['Assignment'],
    }),
    getMyShifts: builder.query({
      query: () => '/shift-assignments/my-shifts',
      providesTags: ['Assignment'],
    }),
    createAssignment: builder.mutation({
      query: (data) => ({ url: '/shift-assignments/', method: 'POST', body: data }),
      invalidatesTags: ['Assignment'],
    }),
    cancelAssignment: builder.mutation({
      query: (id) => ({ url: `/shift-assignments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Assignment'],
    }),
  }),
});

export const {
  useGetAssignmentsQuery,
  useGetMyShiftsQuery,
  useCreateAssignmentMutation,
  useCancelAssignmentMutation,
} = assignmentsApi;