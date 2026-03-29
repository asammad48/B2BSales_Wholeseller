import { safeApiClient as apiClient } from './apiClientSafe';

export interface User {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'staff' | 'client';
  name: string;
  shopId?: string;
  shopName?: string;
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

    const { token, userId, email, fullName, role, shopId, shopName } = response.data as any;
    
    return {
      token: token || '',
      user: {
        id: userId || '',
        email: email || '',
        name: fullName || '',
        role: (role?.toLowerCase() as any) || 'staff',
        shopId: shopId || undefined,
        shopName: shopName || undefined,
      }
    };
  },

  async getMe(): Promise<User> {
    const response = await apiClient.me();

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch user');
    }

    const { id, email, fullName, role, shopId, shopName } = response.data;

    return {
      id: id || '',
      email: email || '',
      name: fullName || '',
      role: (role?.toLowerCase() as any) || 'staff',
      shopId: shopId || undefined,
      shopName: shopName || undefined,
    };
  },

  async me(): Promise<User> {
    return this.getMe();
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
