import { safeApiClient as apiClient } from './apiClientSafe';

export interface ShopLookupItem {
  id: string;
  name: string;
  code?: string;
  isMain?: boolean;
  isActive?: boolean;
}

export const shopsRepository = {
  async getShopsLookup(): Promise<ShopLookupItem[]> {
    const response = await apiClient.lookup();

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch shops lookup');
    }

    return (response.data || []).map((shop) => ({
      id: shop.id || '',
      name: shop.name || '',
      code: shop.code,
      isMain: shop.isMain,
      isActive: shop.isActive,
    }));
  },
};
