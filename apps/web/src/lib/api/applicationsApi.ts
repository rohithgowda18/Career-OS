import restClient from '../restClient';

export const applicationsApi = {

  // Get applications
  list: async function (page = 0, size = 10, sort = 'deadline,asc') {

    const response = await restClient.get('/applications', {
      params: {
        page,
        size,
        sort
      }
    });

    return response.data;
  },

  listByStatus: async function (status: string, page = 0, size = 10, sort = 'deadline,asc') {

    const response = await restClient.get(`/applications/status/${status}`, {
      params: {
        page,
        size,
        sort
      }
    });

    return response.data;
  },

  // Create application
  create: async function (data: any) {

    const response = await restClient.post(
      '/applications',
      data
    );

    return response.data;
  },

  // Update application
  update: async function ({
    id,
    ...data
  }: any) {

    const response = await restClient.put(
      `/applications/${id}`,
      data
    );

    return response.data;
  },

  // Delete application
  delete: async function (id: string | number) {

    const response = await restClient.delete(
      `/applications/${id}`
    );

    return response.data;
  }
};