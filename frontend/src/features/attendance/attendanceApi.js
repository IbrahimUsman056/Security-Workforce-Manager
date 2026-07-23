import { apiSlice } from '../../api/apiSlice';

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    checkIn: builder.mutation({
      query: (formData) => ({ url: '/attendance/check-in', method: 'POST', body: formData }),
      invalidatesTags: ['Attendance'],
    }),
    checkOut: builder.mutation({
      query: ({ shiftAssignmentId, ...data }) => ({
        url: `/attendance/check-out/${shiftAssignmentId}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    getMyAttendance: builder.query({
      query: () => '/attendance/my-attendance',
      providesTags: ['Attendance'],
    }),
  }),
});

export const { useCheckInMutation, useCheckOutMutation, useGetMyAttendanceQuery } = attendanceApi;