import { safeApiClient as apiClient } from './apiClientSafe';
import { ProductLookupResponseDto, ShopLookupResponseDto } from '../api/generated/apiClient';

export interface LookupBundle {
  products: ProductLookupResponseDto[];
  shops: ShopLookupResponseDto[];
}

export const lookupsRepository = {
  async getBundle(): Promise<LookupBundle> {
    const response = await apiClient.bundle();

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch lookup bundle');
    }

    return {
      products: response.data.products || [],
      shops: response.data.shops || [],
    };
  },
};
