import restClient from '../restClient';

export const analyticsApi = {
  summary: async () => (await restClient.get('/analytics/summary')).data,
  acceptanceRates: async () => (await restClient.get('/analytics/rates')).data,
  statusDistribution: async () => (await restClient.get('/analytics/distribution')).data,
};
