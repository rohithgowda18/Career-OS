import restClient from '../restClient';

export const analyticsApi = {
  summary: async () => (await restClient.get('/api/analytics/applications/summary')).data,
  acceptanceRates: async () => (await restClient.get('/api/analytics/applications/conversion-rates')).data,
  statusDistribution: async () => (await restClient.get('/api/analytics/applications/status-distribution')).data,
  dashboard: async () => (await restClient.get('/api/analytics/dashboard')).data,
};
