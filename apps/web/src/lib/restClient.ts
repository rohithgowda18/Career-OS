import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const getApiBaseUrl = () => {
  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:8080';
  }

  throw new Error('VITE_API_URL is required for production builds');
};

// Remove trailing slashes and one /api suffix so callers may configure either
// https://backend.example.com or https://backend.example.com/api.
const normalizedUrl = getApiBaseUrl()
  .replace(/\/+$/, '')
  .replace(/\/api\/?$/, '');

const restClient = axios.create({
  baseURL: normalizedUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});


const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('token');
  if (!token) {
    const match = document.cookie.match(/(^| )token=([^;]+)/);
    if (match) {
      token = match[2];
      localStorage.setItem('token', token);
    }
  }
  return token;
};

// Add a request interceptor to include the JWT token
restClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
restClient.interceptors.response.use(
  (response) => {
    // If the response is HTML but we expected JSON (or any data), it's likely a redirect to a login page
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE')) {
      return Promise.reject({
        message: 'Backend returned an HTML page instead of JSON. You may need to log in again.',
        response,
        status: 401
      });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      document.cookie = 'token=; max-age=0; path=/; samesite=lax';
      window.location.href = '/login';
    }

    if (error.response?.data) {
      const responseData = error.response.data;
      error.message =
        typeof responseData === 'string'
          ? responseData
          : responseData.message || Object.values(responseData).find(value => typeof value === 'string') || error.message;
    } else if (error.code === 'ERR_NETWORK') {
      error.message = 'Unable to reach the API. Check VITE_API_URL and backend CORS settings.';
    }

    return Promise.reject(error);
  }
);

export { normalizedUrl as BACKEND_URL };
export default restClient;

