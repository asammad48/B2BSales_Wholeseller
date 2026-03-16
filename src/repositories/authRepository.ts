import { apiClient } from '../api/client';

export interface User {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'staff' | 'client';
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

const TOKEN_KEY = 'admin_access_token';

export const authRepository = {
  async login(body: any): Promise<LoginResponse> {
    const response = await apiClient.login(body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }

    const { token, userId, email, fullName, role } = response.data;
    
    return {
      token: token || '',
      user: {
        id: userId || '',
        email: email || '',
        name: fullName || '',
        role: (role?.toLowerCase() as any) || 'staff'
      }
    };
  },

  async me(): Promise<User> {
    const response = await apiClient.me();

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch user');
    }

    const { id, email, fullName, role } = response.data;

    return {
      id: id || '',
      email: email || '',
      name: fullName || '',
      role: (role?.toLowerCase() as any) || 'staff'
    };
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
