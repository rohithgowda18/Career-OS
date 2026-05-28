import restClient from '../restClient';

export const applicationsApi = {
  list: async (params?: { page?: number; size?: number }) => {
    // Use size=100 by default to fetch more items for pagination
    const queryParams = (params && 'queryKey' in params) 
      ? { page: 0, size: 100 } 
      : (params || { page: 0, size: 100 });
    const response = (await restClient.get('/applications', { params: queryParams })).data;
    // Return full page object with content and totalElements
    return {
      content: Array.isArray(response) ? response : (response?.content || []),
      totalElements: response?.totalElements || 0,
      totalPages: response?.totalPages || 0,
      currentPage: response?.number || 0,
      size: response?.size || 100,
    };
  },
  create: async (data: any) => (await restClient.post('/applications', data)).data,
  update: async ({ id, ...data }: { id: string | number; [key: string]: any }) => (await restClient.put(`/applications/${id}`, data)).data,
  delete: async (id: string | number) => (await restClient.delete(`/applications/${id}`)).data,
};
