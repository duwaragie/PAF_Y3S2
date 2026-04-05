import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Access the VITE_API_URL or default to localhost if not set
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Log user out or refresh if a generic 401 is thrown logic could go here
    if (error.response?.status === 401 && !originalRequest._retry) {
       // Typically, we'd fire the '/auth/refresh' request using the saved refreshToken
       // and update the store. For now, simple fail logic or logout.
       if (!originalRequest.url?.includes('auth/')) {
        // useAuthStore.getState().logout();
       }
    }
    return Promise.reject(error);
  }
);
