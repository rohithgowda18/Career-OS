import axios from 'axios';

// Get API URL from environment, default to localhost
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080');

// Remove any trailing slashes and /api suffix to normalize
const normalizedUrl = apiBaseUrl
  .replace(/\/+$/, '') // Remove trailing slashes
  .replace(/\/api\/?$/, ''); // Remove /api at the end if present

const restClient = axios.create({
  baseURL: `${normalizedUrl}/api`,
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
    return Promise.reject(error);
  }
);

export default restClient;
