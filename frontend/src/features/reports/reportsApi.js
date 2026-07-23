import { apiSlice } from '../../api/apiSlice';

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayrollReport: builder.query({
      query: ({ startDate, endDate }) => `/reports/payroll?start_date=${startDate}&end_date=${endDate}`,
    }),
    getNetPayrollReport: builder.query({
      query: ({ startDate, endDate }) => `/reports/net-payroll?start_date=${startDate}&end_date=${endDate}`,
    }),
    getIncidentsBySite: builder.query({
      query: () => '/reports/incidents-by-site',
    }),
    getAttendanceRate: builder.query({
      query: ({ startDate, endDate }) => `/reports/attendance-rate?start_date=${startDate}&end_date=${endDate}`,
    }),
  }),
});

export const {
  useGetPayrollReportQuery, useGetNetPayrollReportQuery, useGetIncidentsBySiteQuery, useGetAttendanceRateQuery,
} = reportsApi;