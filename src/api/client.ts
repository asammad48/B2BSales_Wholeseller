import axios from 'axios';
import {
  ApiClient,
  CreateStockTransferRequestDto,
  ProcessStockTransferRequestDto,
} from './generated/apiClient';

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

export interface RepositoryApiClient extends ApiClient {
  transfers(body?: CreateStockTransferRequestDto): ReturnType<ApiClient['transfersPOST']>;
  getStockTransfer(pageNumber?: number, pageSize?: number, search?: string): ReturnType<ApiClient['transfersGET']>;
  dispatchTransfer(id: string, body?: ProcessStockTransferRequestDto): ReturnType<ApiClient['dispatch']>;
  receiveTransfer(id: string, body?: ProcessStockTransferRequestDto): ReturnType<ApiClient['receive']>;
}

export const buildRepositoryApiClient = (client: ApiClient): RepositoryApiClient => {
  const wrappedClient = client as RepositoryApiClient;

  wrappedClient.transfers = (body?: CreateStockTransferRequestDto) => client.transfersPOST(body);
  wrappedClient.getStockTransfer = (pageNumber?: number, pageSize?: number, search?: string) =>
    client.transfersGET(pageNumber, pageSize, search);
  wrappedClient.dispatchTransfer = (id: string, body?: ProcessStockTransferRequestDto) => client.dispatch(id, body);
  wrappedClient.receiveTransfer = (id: string, body?: ProcessStockTransferRequestDto) => client.receive(id, body);

  return wrappedClient;
};

export const apiClient = buildRepositoryApiClient(new ApiClient(baseUrl, axiosInstance));
export { ApiClient };
