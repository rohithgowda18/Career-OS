import restClient from '../restClient';

export const analyticsApi = {
  summary: async () => (await restClient.get('/analytics/summary')).data,
  acceptanceRates: async () => (await restClient.get('/analytics/rates')).data,
  seasonalTrends: async () => (await restClient.get('/analytics/trends')).data,
  statusDistribution: async () => (await restClient.get('/analytics/distribution')).data,
  generateRecommendations: async () => (await restClient.get('/recommendations/generate')).data,
  calendarConflicts: async () => (await restClient.get('/calendar/conflicts')).data,
  getSuccessScore: async (appId: string | number) => (await restClient.get(`/success-scoring/${appId}`)).data,
};
