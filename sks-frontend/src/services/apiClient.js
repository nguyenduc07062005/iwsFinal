import axios from 'axios';
import {
  getToken,
  expireSession,
  isAuthRoutePath,
  isTokenExpired,
} from '../utils/auth.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();

  if (!token) {
    return config;
  }

  if (isTokenExpired()) {
    if (typeof window !== 'undefined') {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const isAuthRoute = isAuthRoutePath(window.location.pathname);

      expireSession({
        redirectPath: isAuthRoute ? '' : currentPath,
      });

      if (!isAuthRoute) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(
      new axios.CanceledError('Session expired. Please sign in again.'),
    );
  }

  if (!config.headers) {
    config.headers = {};
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = Boolean(getToken());

      if (hadToken && typeof window !== 'undefined') {
        const currentPath = `${window.location.pathname}${window.location.search}`;
        const isAuthRoute = isAuthRoutePath(window.location.pathname);

        expireSession({
          redirectPath: isAuthRoute ? '' : currentPath,
        });

        if (!isAuthRoute) {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
