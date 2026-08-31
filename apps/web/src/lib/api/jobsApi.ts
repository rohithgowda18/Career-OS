import restClient from '../restClient';

export interface JobDTO {
  externalJobId: string;
  title: string;
  company: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  workMode?: string;
  source?: string;
  applyUrl: string;
  description?: string;
  postedAt?: string;
  salary?: string;
  skills?: string[];
  saved?: boolean;
  savedJobId?: number;
}

export interface JobSearchParams {
  keyword?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  workMode?: string;
  company?: string;
  sortBy?: string;
  page?: number;
  size?: number;
}

export interface JobSearchResult {
  content: JobDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  source: string;
}

export const jobsApi = {
  searchJobs: async (params?: JobSearchParams): Promise<JobSearchResult> => {
    const response = (await restClient.get('/api/jobs', { params })).data;
    return {
      content: response?.content || [],
      totalElements: response?.totalElements || 0,
      totalPages: response?.totalPages || 0,
      currentPage: response?.currentPage || 0,
      size: response?.size || 10,
      source: response?.source || 'Adzuna',
    };
  },

  getJobDetails: async (externalJobId: string): Promise<JobDTO> => {
    const response = await restClient.get(`/api/jobs/${encodeURIComponent(externalJobId)}`);
    return response.data;
  },

  getSavedJobs: async (page = 0, size = 10): Promise<{ content: JobDTO[]; totalElements: number; totalPages: number }> => {
    const response = (await restClient.get('/api/jobs/saved', { params: { page, size } })).data;
    return {
      content: response?.content || [],
      totalElements: response?.totalElements || 0,
      totalPages: response?.totalPages || 0,
    };
  },

  saveJob: async (job: JobDTO): Promise<any> => {
    const response = await restClient.post('/api/jobs/saved', job);
    return response.data;
  },

  deleteSavedJob: async (savedJobId: number): Promise<void> => {
    await restClient.delete(`/api/jobs/saved/${savedJobId}`);
  },

  trackApplication: async (job: JobDTO, status = 'Applied'): Promise<any> => {
    const response = await restClient.post('/api/jobs/track', job, { params: { status } });
    return response.data;
  },
};
