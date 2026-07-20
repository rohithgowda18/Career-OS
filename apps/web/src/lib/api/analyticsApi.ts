import restClient from '../restClient';

export const analyticsApi = {
  getApplicationsAnalytics: async () => (await restClient.get('/api/analytics/applications')).data,
  dashboard: async () => (await restClient.get('/api/analytics/dashboard')).data,
};
