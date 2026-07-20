import restClient from '../restClient';

export interface ApplicationListParams {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
  eventType?: string;
}

export const applicationsApi = {
  list: async (params?: ApplicationListParams) => {
    const queryParams = {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sort: params?.sort ?? 'deadline,asc',
      status: params?.status,
      eventType: params?.eventType,
    };
    const response = (await restClient.get('/api/applications', { params: queryParams })).data;
    
    // Return Spring Page response structure
    return {
      content: response?.content || [],
      totalElements: response?.totalElements || 0,
      totalPages: response?.totalPages || 0,
      currentPage: response?.number || 0,
      size: response?.size || 20,
    };
  },
  create: async (data: any) => (await restClient.post('/api/applications', data)).data,
  update: async ({ id, ...data }: { id: string | number; [key: string]: any }) => (await restClient.put(`/api/applications/${id}`, data)).data,
  delete: async (id: string | number) => (await restClient.delete(`/api/applications/${id}`)).data,
  extract: async (emailContent: string) => (await restClient.post('/api/applications/extract', { emailContent })).data,
};
