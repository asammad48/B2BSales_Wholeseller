import { apiClient } from '../api/client';

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
    const normalizedSearch = search.trim() || undefined;
    const response = await apiClient.productsGET(page, limit, normalizedSearch, sortBy, sortDirection);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch products');
    }

    return {
      data: (response.data.items || []) as any[],
      total: response.data.totalCount || 0,
      page: response.data.pageNumber || 1,
      limit: response.data.pageSize || 10
    };
  },



  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.productsGET2(id);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch product');
    }

    return response.data as any;
  },
  async createProduct(product: Partial<Product>): Promise<Product> {
    const response = await apiClient.productsPOST(product as any);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create product');
    }

    return response.data as any;
  }
};
