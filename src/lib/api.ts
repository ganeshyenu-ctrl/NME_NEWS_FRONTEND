import axios from 'axios';
import { SECURE_ADMIN_LOGIN_PATH } from '@/config/routes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor to inject JWT Access Token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('nme_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('nme_refresh_token');

        if (refreshToken) {
          try {
            const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              token: refreshToken,
            });

            if (data?.accessToken) {
              localStorage.setItem('nme_access_token', data.accessToken);
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
              return api(originalRequest);
            }
          } catch (refreshErr) {
            localStorage.removeItem('nme_access_token');
            localStorage.removeItem('nme_refresh_token');
            localStorage.removeItem('nme_user');
            if (window.location.pathname.startsWith('/admin') && window.location.pathname !== SECURE_ADMIN_LOGIN_PATH) {
              window.location.href = SECURE_ADMIN_LOGIN_PATH;
            }
          }
        }
      }
    }

    return Promise.reject(error);
  }
);
