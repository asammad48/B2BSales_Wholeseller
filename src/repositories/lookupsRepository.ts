import { safeApiClient as apiClient } from './apiClientSafe';

export interface LookupOption {
  id: string;
  name: string;
}

export interface ShopLookupOption extends LookupOption {
  code?: string;
}

export interface InventoryFormLookups {
  products: LookupOption[];
  shops: ShopLookupOption[];
}

export const lookupsRepository = {
  async getInventoryFormLookups(): Promise<InventoryFormLookups> {
    const response = await apiClient.bundle();

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch lookup bundle');
    }

    return {
      products: (response.data.products || []).map((product) => ({
        id: product.id || '',
        name: product.name || '',
      })),
      shops: (response.data.shops || []).map((shop) => ({
        id: shop.id || '',
        name: shop.name || '',
        code: shop.code,
      })),
    };
  },
};
