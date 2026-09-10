import axios from 'axios';

// Single Unified Entry Point (API Gateway)
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const getApiBaseUrl = () => {
  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:8080'; // API Gateway port
  }

  throw new Error('VITE_API_URL is required for production builds');
};

// Normalize API Gateway base URL
const normalizedUrl = getApiBaseUrl()
  .replace(/\/+$/, '')
  .replace(/\/api\/?$/, '');

// Create single Axios client targeting the API Gateway
const restClient = axios.create({
  baseURL: normalizedUrl,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token and attach start time
restClient.interceptors.request.use(
  (config) => {
    // All routes (/api/auth, /api/applications, etc.) flow transparently through the API Gateway
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Attach start timestamp for latency profiling
    (config as any)._startTime = performance.now();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to log color-coded latency measurements in browser console
const logEndpointLatency = (config: any, status: number) => {
  if (import.meta.env.DEV && config?._startTime) {
    const duration = Math.round(performance.now() - config._startTime);
    const method = (config.method || 'GET').toUpperCase();
    const url = config.url || '';

    if (duration >= 3000) {
      console.error(`%c[LATENCY: 3+ s CRITICAL]%c ${method} ${url} (${status}) -> ${duration}ms`, 'color: #EF4444; font-weight: bold;', 'color: inherit;');
    } else if (duration >= 1000) {
      console.warn(`%c[LATENCY: 1-3 s HIGH]%c ${method} ${url} (${status}) -> ${duration}ms`, 'color: #F59E0B; font-weight: bold;', 'color: inherit;');
    } else if (duration >= 500) {
      console.warn(`%c[LATENCY: 500ms-1s SLOW]%c ${method} ${url} (${status}) -> ${duration}ms`, 'color: #EAB308; font-weight: bold;', 'color: inherit;');
    } else if (duration >= 200) {
      console.info(`%c[LATENCY: 200-500ms OK]%c ${method} ${url} (${status}) -> ${duration}ms`, 'color: #3B82F6;', 'color: inherit;');
    } else {
      console.log(`%c[LATENCY: <200ms FAST]%c ${method} ${url} (${status}) -> ${duration}ms`, 'color: #22C55E;', 'color: inherit;');
    }
  }
};

// Add a response interceptor to handle authentication errors & measure latency
restClient.interceptors.response.use(
  (response) => {
    logEndpointLatency(response.config, response.status);

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
    if (error.config) {
      logEndpointLatency(error.config, error.response?.status || 0);
    }

    if (error.response?.status === 401) {
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
      error.message = 'Unable to reach the API Gateway. Check VITE_API_URL and Gateway CORS settings.';
    }

    return Promise.reject(error);
  }
);

// Backward compatibility: Both point to the single abstracted Gateway URL
export { normalizedUrl as BACKEND_URL, normalizedUrl as AUTH_BACKEND_URL };
export default restClient;
