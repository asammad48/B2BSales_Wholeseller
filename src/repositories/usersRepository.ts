import {
  CreateUserRequestDto,
  LanguageLookupResponseDto,
  LookupBundleResponseDto,
  ShopLookupResponseDto,
  UserListItemResponseDto,
} from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';

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

export interface UserFormLookups {
  shops: ShopLookupResponseDto[];
  languages: LanguageLookupResponseDto[];
}

const mapUser = (item: UserListItemResponseDto): UserAdmin => ({
  id: item.id || '',
  fullName: item.fullName || '',
  email: item.email || '',
  roleNames: item.role ? [item.role] : [],
  shopName: item.shopName || '—',
  isActive: item.isActive ?? false,
});

export const usersRepository = {
  async getUsers(page: number = 1, limit: number = 10, search: string = ''): Promise<UsersResponse> {
    const normalizedSearch = search.trim() || undefined;
    const response = await apiClient.usersGET(page, limit, normalizedSearch);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch users');
    }

    return {
      data: (response.data.items || []).map(mapUser),
      total: response.data.totalCount || 0,
    };
  },

  async createUser(body: CreateUserRequestDto): Promise<UserAdmin> {
    const response = await apiClient.usersPOST(body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create user');
    }

    return mapUser(response.data);
  },

  async getCreateUserLookups(): Promise<UserFormLookups> {
    const response = await apiClient.bundle();

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch user form lookups');
    }

    const bundle: LookupBundleResponseDto = response.data;

    return {
      shops: bundle.shops || [],
      languages: bundle.languages || [],
    };
  },
};
