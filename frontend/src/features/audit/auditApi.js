import { apiSlice } from '../../api/apiSlice';

export const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: ({ entityType, entityId } = {}) => {
        const params = new URLSearchParams();
        if (entityType) params.append('entity_type', entityType);
        if (entityId) params.append('entity_id', entityId);
        return `/audit-logs/?${params.toString()}`;
      },
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditApi;