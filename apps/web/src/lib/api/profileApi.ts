import restClient from '../restClient';

export const profileApi = {
  me: async () => (await restClient.get('/profile/me')).data,
  getByUsername: async (username: string) => (await restClient.get(`/profile/public/${username}`)).data,
  getStats: async (username: string) => (await restClient.get(`/profile/public/${username}/stats`)).data,
  getApplications: async (username: string) => (await restClient.get(`/profile/public/${username}/applications`)).data,
  getPreferences: async () => (await restClient.get('/preferences')).data,
  updatePreferences: async (data: any) => (await restClient.put('/preferences', data)).data,
  upsertApplicationProfile: async (data: any) => (await restClient.put('/recommendations/profile', data)).data,
};
