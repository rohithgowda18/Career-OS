import restClient from '../restClient';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
};

export const authApi = {
  me: async () => (await restClient.get('/api/auth/me')).data,
  login: async (data: LoginPayload) => {
    const res = await restClient.post('/api/auth/login', data);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      document.cookie = `token=${res.data.token}; max-age=1296000; path=/; samesite=lax`;
    }
    return res.data;
  },
  register: async (data: RegisterPayload) => {
    const res = await restClient.post('/api/auth/register', data);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      document.cookie = `token=${res.data.token}; max-age=1296000; path=/; samesite=lax`;
    }
    return res.data;
  },
};
