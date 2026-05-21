import restClient from '../restClient';

export const applicationsApi = {
  list: async () => {
    const response = await restClient.get('/applications');
    return response.data.content || [];
  },
  create: async (data: any) => (await restClient.post('/applications', data)).data,
  update: async ({ id, ...data }: { id: string | number; [key: string]: any }) => (await restClient.put(`/applications/${id}`, data)).data,
  delete: async (id: string | number) => (await restClient.delete(`/applications/${id}`)).data,
};
