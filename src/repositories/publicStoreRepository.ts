import { apiClient } from '../api/client';
import { ProductDetailResponseDto } from '../api/generated/apiClient';

export const publicStoreRepository = {
  async getProductDetail(id: string): Promise<ProductDetailResponseDto> {
    const response = await apiClient.public2(id);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch product details');
    }
    return response.data;
  }
};
