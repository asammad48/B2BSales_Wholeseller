import axios from 'axios';

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const adminHttp = axios.create({
  baseURL: baseUrl,
  transformResponse: [(data) => data],
});

adminHttp.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const isEnvelope = <T,>(value: unknown): value is ApiEnvelope<T> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'success' in (value as Record<string, unknown>) || 'data' in (value as Record<string, unknown>) || 'message' in (value as Record<string, unknown>);
};

export const parseJson = <T>(raw: unknown): T => {
  if (typeof raw === 'string') {
    return JSON.parse(raw) as T;
  }

  return raw as T;
};

export const unwrapApiResponse = <T>(raw: unknown): T => {
  const parsed = parseJson<ApiEnvelope<T> | T>(raw);

  if (isEnvelope<T>(parsed)) {
    if (parsed.success === false) {
      throw new Error(parsed.message || 'Request failed');
    }

    if (parsed.data === undefined || parsed.data === null) {
      throw new Error(parsed.message || 'No data returned');
    }

    return parsed.data;
  }

  return parsed as T;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    try {
      const parsed = parseJson<ApiEnvelope<unknown> | { message?: string }>(responseData);
      if (parsed && typeof parsed === 'object' && 'message' in parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message;
      }
    } catch {
      // ignore invalid JSON and fall through to generic message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};
