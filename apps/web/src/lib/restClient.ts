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

const configuredAuthUrl = import.meta.env.VITE_AUTH_API_URL?.trim();
const authBaseUrl = configuredAuthUrl || (import.meta.env.DEV ? 'http://localhost:8081' : normalizedUrl);
const normalizedAuthUrl = authBaseUrl.replace(/\/+$/, '').replace(/\/api\/?$/, '');

const configuredJobUrl = import.meta.env.VITE_JOB_API_URL?.trim();
const jobBaseUrl = configuredJobUrl || (import.meta.env.DEV ? 'http://localhost:8083' : normalizedUrl);
const normalizedJobUrl = jobBaseUrl.replace(/\/+$/, '').replace(/\/api\/?$/, '');

const configuredCodingUrl = import.meta.env.VITE_CODING_API_URL?.trim();
const codingBaseUrl = configuredCodingUrl || (import.meta.env.DEV ? 'http://localhost:8084' : normalizedUrl);
const normalizedCodingUrl = codingBaseUrl.replace(/\/+$/, '').replace(/\/api\/?$/, '');

const restClient = axios.create({
  baseURL: normalizedUrl,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add a request interceptor to include the JWT token
restClient.interceptors.request.use(
  (config) => {
    // Dynamic routing to Auth Service (:8081)
    if (config.url && (config.url.startsWith('/api/auth') || config.url.startsWith('/api/profile') || config.url.startsWith('/login/oauth2'))) {
      config.baseURL = normalizedAuthUrl;
    }
    // Dynamic routing to Job Discovery Service (:8083)
    else if (config.url && config.url.startsWith('/api/jobs') && !config.url.startsWith('/api/jobs/saved') && !config.url.startsWith('/api/jobs/track')) {
      config.baseURL = normalizedJobUrl;
    }
    // Dynamic routing to Coding Service (:8084)
    else if (config.url && config.url.startsWith('/api/coding')) {
      config.baseURL = normalizedCodingUrl;
    }
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
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

export { normalizedUrl as BACKEND_URL, normalizedAuthUrl as AUTH_BACKEND_URL };
export default restClient;

