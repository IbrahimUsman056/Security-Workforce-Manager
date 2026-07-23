import { apiSlice } from '../../api/apiSlice';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceTrend: builder.query({
      query: (days = 30) => `/dashboard/attendance-trend?days=${days}`,
    }),
    getIncidentHeatmap: builder.query({
      query: () => '/dashboard/incident-heatmap',
    }),
    getStaffHours: builder.query({
      query: (days = 30) => `/dashboard/staff-hours?days=${days}`,
    }),
    getForecast: builder.query({
      query: (siteId) => `/dashboard/forecast?site_id=${siteId}`,
    }),
    getMlForecast: builder.query({
      query: (siteId) => `/dashboard/ml-forecast?site_id=${siteId}`,
    }),
  }),
});

export const {
  useGetAttendanceTrendQuery, useGetIncidentHeatmapQuery, useGetStaffHoursQuery, useGetForecastQuery, useGetMlForecastQuery,
} = dashboardApi;