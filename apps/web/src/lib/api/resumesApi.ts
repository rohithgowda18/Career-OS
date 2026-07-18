import restClient from '../restClient';

export interface ResumeData {
  id: number;
  userId: number;
  name: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

export const resumesApi = {
  list: async () => (await restClient.get<ResumeData[]>('/api/resumes')).data,
  upload: async (name: string, file: File) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    return (await restClient.post<ResumeData>('/api/resumes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })).data;
  },
  rename: async (id: number, name: string) => 
    (await restClient.put<ResumeData>(`/api/resumes/${id}/rename`, { name })).data,
  delete: async (id: number) => (await restClient.delete(`/api/resumes/${id}`)).data,
  download: async (id: number, fileName: string) => {
    const response = await restClient.get(`/api/resumes/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
