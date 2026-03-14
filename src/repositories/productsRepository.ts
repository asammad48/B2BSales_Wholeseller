import { apiClient } from '../api/generated/apiClient';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  brandName: string;
  modelName: string;
  categoryName: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  trackingType: 'Serialized' | 'Non-Serialized' | 'None' | 'Serial' | 'Batch';
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export const productsRepository = {
  async getProducts(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    sortBy: string = 'createdAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<ProductsResponse> {
    return apiClient.productsGET(page, limit, search, sortBy, sortDirection);
  },

  async productsPOST(product: Partial<Product>): Promise<Product> {
    return apiClient.productsPOST(product);
  }
};
