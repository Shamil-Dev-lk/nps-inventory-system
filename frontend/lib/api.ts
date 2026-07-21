import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Attach token and language header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const lang = typeof window !== 'undefined' ? (localStorage.getItem('language') || 'en') : 'en';
    config.headers['Accept-Language'] = lang;

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Don't redirect if we are already on the login page or the request was to login
      const isLoginRequest = error.config?.url?.includes('/login');
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

      if (!isLoginRequest && !isLoginPage) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
