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


const dbName = 'OMPAuthDB';
const storeName = 'auth';

export const saveTokenToIndexedDB = (token: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(token, 'token');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      } catch (e) {
        reject(e);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const getTokenFromIndexedDB = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const getReq = store.get('token');
        getReq.onsuccess = () => {
          db.close();
          resolve(getReq.result || null);
        };
        getReq.onerror = () => {
          db.close();
          resolve(null);
        };
      } catch (e) {
        resolve(null);
      }
    };
    request.onerror = () => resolve(null);
  });
};

export const removeTokenFromIndexedDB = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    const request = indexedDB.open(dbName, 1);
    request.onsuccess = () => {
      const db = request.result;
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete('token');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      } catch (e) {
        resolve();
      }
    };
    request.onerror = () => resolve();
  });
};

const getStoredTokenAsync = async () => {
  if (typeof window === 'undefined') return null;
  
  // 1. Try LocalStorage
  let token = localStorage.getItem('token');
  if (token) return token;

  // 2. Try Cookie
  const match = document.cookie.match(/(^| )token=([^;]+)/);
  if (match) {
    token = match[2];
    localStorage.setItem('token', token);
    await saveTokenToIndexedDB(token);
    return token;
  }

  // 3. Try IndexedDB (main survival layer for mobile PWA standalone mode)
  token = await getTokenFromIndexedDB();
  if (token) {
    localStorage.setItem('token', token);
    const secureFlag = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `token=${token}; max-age=1296000; path=/; samesite=lax${secureFlag}`;
    return token;
  }

  return null;
};

// Add a request interceptor to include the JWT token
restClient.interceptors.request.use(
  async (config) => {
    const token = await getStoredTokenAsync();
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
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; secure' : '';
      document.cookie = `token=; max-age=0; path=/; samesite=lax${secureFlag}`;
      await removeTokenFromIndexedDB();
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

