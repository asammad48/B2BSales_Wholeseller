import axios, { AxiosInstance } from 'axios';

export const http: AxiosInstance = axios.create();

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('buyer_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('buyer_access_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
