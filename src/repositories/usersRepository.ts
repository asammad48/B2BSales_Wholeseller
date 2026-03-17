import { apiClient } from '../api/client';

export interface UserAdmin {
  id: string;
  fullName: string;
  email: string;
  roleNames: string[];
  shopName: string;
  isActive: boolean;
}

export interface UsersResponse {
  data: UserAdmin[];
  total: number;
}

export const usersRepository = {
  async getUsers(page: number = 1, limit: number = 10, search: string = ''): Promise<UsersResponse> {
    const normalizedSearch = search.trim() || undefined;
    const response = await apiClient.users(page, limit, normalizedSearch);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch users');
    }

    return {
      data: (response.data.items || []) as any[],
      total: response.data.totalCount || 0
    };
  },
};
