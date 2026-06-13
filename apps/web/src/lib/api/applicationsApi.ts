import restClient from '../restClient';

export interface ApplicationListParams {
  page?: number;
  size?: number;
  sort?: string; // e.g., "deadline,asc" or "createdAt,desc"
  status?: string;
  search?: string;
}

export const applicationsApi = {
  list: async (params?: ApplicationListParams) => {
    // Use Spring Boot Pageable defaults: page=0, size=20, sort=deadline,asc
    const queryParams = {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sort: params?.sort ?? 'deadline,asc', // Default sort by deadline ascending
      status: params?.status,
      search: params?.search,
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
};
