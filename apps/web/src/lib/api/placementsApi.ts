import restClient from '../restClient';

export interface PlacementListParams {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
}

export const placementsApi = {
  list: async (params?: PlacementListParams) => {
    const queryParams = {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sort: params?.sort ?? 'id,desc',
      status: params?.status,
    };
    const response = (await restClient.get('/api/placements', { params: queryParams })).data;
    
    return {
      content: response?.content || [],
      totalElements: response?.totalElements || 0,
      totalPages: response?.totalPages || 0,
      currentPage: response?.number || 0,
      size: response?.size || 20,
    };
  },
  create: async (data: any) => (await restClient.post('/api/placements', data)).data,
  update: async ({ id, ...data }: { id: string | number; [key: string]: any }) => (await restClient.put(`/api/placements/${id}`, data)).data,
  delete: async (id: string | number) => (await restClient.delete(`/api/placements/${id}`)).data,
  getByStatus: async (status: string) => (await restClient.get('/api/placements', { params: { status } })).data,
  getAnalytics: async () => {
    const response = await restClient.get('/api/analytics/placements');
    return response.data;
  },
  getTrends: async () => (await restClient.get('/api/analytics/placements/trends')).data,
  extract: async (emailContent: string) => (await restClient.post('/api/placements/extract', { emailContent })).data,
};
