import restClient from '../restClient';

export const userApi = {
  getProfile: async () => {
    const response = await restClient.get('/profile/me');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await restClient.put('/profile/me', data);
    return response.data;
  },
};
