import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const getApiBaseUrl = () => {
  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  // In production builds, we strictly require VITE_API_URL
  if (import.meta.env.PROD && !configuredApiUrl) {
    console.error('❌ VITE_API_URL is missing in production build! Falling back to current origin.');
    return window.location.origin;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:8080';
  }

  return 'http://localhost:8080'; // Final fallback
};

// Remove trailing slashes and one /api suffix
const rawBaseUrl = getApiBaseUrl();
const normalizedUrl = rawBaseUrl
  .replace(/\/+$/, '')
  .replace(/\/api\/?$/, '');

export const API_BASE_URL = normalizedUrl;

if (import.meta.env.DEV || import.meta.env.PROD) {
  console.log(`🚀 [EventTracker] API Base URL: ${API_BASE_URL}`);
}

const restClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add a request interceptor to include the JWT token
restClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      // window.location.href = '/login';
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

export default restClient;
