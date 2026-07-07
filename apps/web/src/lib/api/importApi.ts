import restClient from '../restClient';

export type ImportRequest = {
  source: string;
  title?: string;
  content: string;
};

export type ImportResponse = {
  source: string;
  classification: string;
  type: 'PLACEMENT' | 'APPLICATION';
  id: number;
  title: string;
  company?: string;
  role?: string;
  eventType?: string;
};

export const importApi = {
  importText: async (payload: ImportRequest): Promise<ImportResponse> => {
    const response = await restClient.post('/api/import/text', payload);
    return response.data;
  }
};
