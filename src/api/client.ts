import axios from 'axios';
import { ApiClient } from './generated/apiClient';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

const axiosInstance = axios.create({
  baseURL: baseUrl,
  transformResponse: [(data) => data],
});

// Add a request interceptor to include the JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiClient = new ApiClient(baseUrl, axiosInstance);
export { ApiClient };
