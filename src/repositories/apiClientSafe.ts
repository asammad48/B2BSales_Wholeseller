import axios from 'axios';
import { ApiClient } from '../api/generated/apiClient';
import { buildRepositoryApiClient } from '../api/client';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

const axiosInstance = axios.create({
  baseURL: baseUrl,
  transformResponse: [(data) => data],
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const safeApiClient = buildRepositoryApiClient(new ApiClient(baseUrl, axiosInstance));
