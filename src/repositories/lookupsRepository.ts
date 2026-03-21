import { CurrencyLookupResponseDto, ProductLookupResponseDto, ShopLookupResponseDto } from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';

export interface LookupBundle {
  products: ProductLookupResponseDto[];
  shops: ShopLookupResponseDto[];
  currencies: CurrencyLookupResponseDto[];
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
      currencies: response.data.currencies || [],
    };
  },
};
