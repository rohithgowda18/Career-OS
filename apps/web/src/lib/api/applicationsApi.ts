import restClient from '../restClient';

export const applicationsApi = {
  list: async () => (await restClient.get('/applications')).data,
  create: async (data: any) => (await restClient.post('/applications', data)).data,
  update: async ({ id, ...data }: { id: string | number; [key: string]: any }) => (await restClient.put(`/applications/${id}`, data)).data,
  delete: async (id: string | number) => (await restClient.delete(`/applications/${id}`)).data,
};
