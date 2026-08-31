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
  q?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  workMode?: string;
  days?: number;
  page?: number;
  size?: number;
}

export interface JobSearchResponse {
  jobs: JobDTO[];
  total: number;
  page: number;
  size: number;
  source: string;
}

export const jobsApi = {
  // Queries Job Service (:8083) for live Jobvetta listings
  searchJobs: async (params?: JobSearchParams): Promise<JobSearchResponse> => {
    const response = (await restClient.get('/api/jobs', { params })).data;
    return {
      jobs: response?.jobs || [],
      total: response?.total || 0,
      page: response?.page || 0,
      size: response?.size || 10,
      source: response?.source || 'Jobvetta',
    };
  },

  // Queries Job Service (:8083) for structured Jobvetta job details
  getJobDetails: async (externalJobId: string): Promise<JobDTO> => {
    const response = await restClient.get(`/api/jobs/${encodeURIComponent(externalJobId)}`);
    return response.data;
  },

  // Queries Career Service (:8080) for authenticated user's saved jobs
  getSavedJobs: async (page = 0, size = 10): Promise<{ content: JobDTO[]; totalElements: number; totalPages: number }> => {
    const response = (await restClient.get('/api/jobs/saved', { params: { page, size } })).data;
    return {
      content: response?.content || [],
      totalElements: response?.totalElements || 0,
      totalPages: response?.totalPages || 0,
    };
  },

  // Calls Career Service (:8080) to persist a saved job
  saveJob: async (job: JobDTO): Promise<any> => {
    const response = await restClient.post('/api/jobs/saved', job);
    return response.data;
  },

  // Calls Career Service (:8080) to delete a saved job
  deleteSavedJob: async (savedJobId: number): Promise<void> => {
    await restClient.delete(`/api/jobs/saved/${savedJobId}`);
  },

  // Calls Career Service (:8080) to convert a job into an active Application
  trackApplication: async (job: JobDTO, status = 'Applied'): Promise<any> => {
    const response = await restClient.post('/api/jobs/track', job, { params: { status } });
    return response.data;
  },
};
