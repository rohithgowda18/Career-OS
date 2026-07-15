import restClient from '../restClient';

export interface SkillListParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
}

export interface SkillData {
  id?: number;
  name: string;
  category: string;
  level: string;
}

export const skillsApi = {
  list: async (params?: SkillListParams) => {
    const queryParams = {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
      sort: params?.sort ?? 'name,asc',
      search: params?.search,
    };
    const response = (await restClient.get('/api/skills', { params: queryParams })).data;
    
    return {
      content: response?.content || [],
      totalElements: response?.totalElements || 0,
      totalPages: response?.totalPages || 0,
      currentPage: response?.number || 0,
      size: response?.size || 10,
    };
  },
  create: async (data: SkillData) => (await restClient.post('/api/skills', data)).data,
  update: async ({ id, ...data }: { id: string | number; name: string; category: string; level: string }) => 
    (await restClient.put(`/api/skills/${id}`, data)).data,
  delete: async (id: string | number) => (await restClient.delete(`/api/skills/${id}`)).data,
};
