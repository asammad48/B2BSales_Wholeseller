import { safeApiClient as apiClient } from './apiClientSafe';
import { ProductDetailResponseDto } from '../api/generated/apiClient';

export const publicStoreRepository = {
  async publicProductsGET(id: string): Promise<ProductDetailResponseDto> {
    const response = await apiClient.productsGET2(id);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch product details');
    }
    return response.data;
  },

  async getProductDetail(id: string): Promise<ProductDetailResponseDto> {
    return publicStoreRepository.publicProductsGET(id);
  },
};
