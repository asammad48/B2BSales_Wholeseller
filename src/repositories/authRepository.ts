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
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async me(): Promise<User> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error('No token found');

    const response = await fetch('/api/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.removeItem(TOKEN_KEY);
      throw new Error('Failed to fetch user');
    }

    return response.json();
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
