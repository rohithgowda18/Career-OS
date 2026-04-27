import restClient from '../restClient';

export const authApi = {
  me: async () => (await restClient.get('/auth/me')).data,
  login: async (data: any) => {
    const res = await restClient.post('/auth/login', data);
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  },
  register: async (data: any) => {
    const res = await restClient.post('/auth/register', data);
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  },
};
