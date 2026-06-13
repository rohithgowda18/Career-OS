import restClient from '../restClient';

export const userApi = {
  getProfile: async () => {
    const response = await restClient.get('/api/profile');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await restClient.put('/api/profile', data);
    return response.data;
  },
};
