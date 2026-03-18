import { safeApiClient as apiClient } from './apiClientSafe';

export interface ShopLookupItem {
  id: string;
  name: string;
  code?: string;
}

export const shopsRepository = {
  async getShopsLookup(): Promise<ShopLookupItem[]> {
    const response = await apiClient.lookup();
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to load shops lookup');
    }
    return response.data as ShopLookupItem[];
  },
};
