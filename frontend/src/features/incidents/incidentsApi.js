import { apiSlice } from '../../api/apiSlice';

export const incidentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyReports: builder.query({
      query: () => '/incidents/my-reports',
      providesTags: ['Incident'],
    }),
    getAllIncidents: builder.query({
      query: () => '/incidents/',
      providesTags: ['Incident'],
    }),
    createIncident: builder.mutation({
      query: (formData) => ({ url: '/incidents/', method: 'POST', body: formData }),
      invalidatesTags: ['Incident'],
    }),
    updateIncidentStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/incidents/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Incident'],
    }),
  }),
});

export const {
  useGetMyReportsQuery,
  useGetAllIncidentsQuery,
  useCreateIncidentMutation,
  useUpdateIncidentStatusMutation,
} = incidentsApi;