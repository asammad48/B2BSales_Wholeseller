import { apiClient } from '../api/generated/apiClient';

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
    const data = await apiClient.usersGET(search);
    return {
      data,
      total: data.length
    };
  },
};
