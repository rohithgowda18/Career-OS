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
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});


console.log(`[Debug REST] Axios instance initialized with baseURL: "${normalizedUrl}"`);

// Add a request interceptor to include the JWT token
restClient.interceptors.request.use(
  (config) => {
    console.log(`[Debug REST] Request Interceptor - URL: "${config.url}", Method: "${config.method}", fullURL: "${config.baseURL || ''}${config.url || ''}"`);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[Debug REST] Authorization Token attached to headers`);
      } else {
        console.log(`[Debug REST] No token found in localStorage`);
      }
    }
    console.log(`[Debug REST] Request Headers:`, config.headers);
    return config;
  },
  (error) => {
    console.error(`[Debug REST] Request Interceptor Error:`, error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
restClient.interceptors.response.use(
  (response) => {
    console.log(`[Debug REST] Response Interceptor Success - URL: "${response.config.url}", Status: ${response.status}`);
    // If the response is HTML but we expected JSON (or any data), it's likely a redirect to a login page
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE')) {
      console.warn(`[Debug REST] Received HTML page instead of JSON! Presuming unauthorized redirect.`);
      return Promise.reject({
        message: 'Backend returned an HTML page instead of JSON. You may need to log in again.',
        response,
        status: 401
      });
    }
    return response;
  },
  async (error) => {
    console.error(`[Debug REST] Response Interceptor Error - URL: "${error.config?.url}", Status: ${error.response?.status}, Code: ${error.code}, Message: ${error.message}`);
    if (error.response?.status === 401) {
      console.log(`[Debug REST] Unauthorized (401) - Clearing token and redirecting to /login`);
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

export { normalizedUrl as BACKEND_URL };
export default restClient;

