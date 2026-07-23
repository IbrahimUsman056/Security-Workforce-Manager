import { apiSlice } from '../../api/apiSlice';

export const clientApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMySites: builder.query({
      query: () => '/client/sites',
    }),
    getCoverage: builder.query({
      query: (siteId) => `/client/coverage?site_id=${siteId}`,
    }),
    getClientIncidents: builder.query({
      query: (siteId) => `/client/incidents?site_id=${siteId}`,
    }),
    getClientInvoices: builder.query({
      query: (siteId) => `/client/invoices?site_id=${siteId}`,
    }),
  }),
});

export const {
  useGetMySitesQuery, useGetCoverageQuery, useGetClientIncidentsQuery, useGetClientInvoicesQuery,
} = clientApi;