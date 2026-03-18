import { apiClient } from '../api/client';
import {
  CreateProductRequestDto,
  PricingMode,
  PublicLookupItemDto,
  QualityType,
  TrackingType,
} from '../api/generated/apiClient';

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
  trackingType: TrackingType;
  qualityType: QualityType;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface CatalogLookups {
  categories: PublicLookupItemDto[];
  brands: PublicLookupItemDto[];
  models: PublicLookupItemDto[];
  partTypes: PublicLookupItemDto[];
}

export interface CreateProductPayload extends Omit<CreateProductRequestDto, 'images'> {
  primaryImagePath?: string;
  primaryImageAltText?: string;
}

export interface AdjustProductPricingPayload {
  buyingPrice: number;
  sellingPrice: number;
  pricingMode?: PricingMode;
  markupPercentage?: number;
  reason?: string;
  updateDefaultPrice?: boolean;
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
      limit: response.data.pageSize || 10,
    };
  },

  async getCatalogLookups(): Promise<CatalogLookups> {
    const response = await apiClient.lookups();

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch catalog lookups');
    }

    return {
      categories: response.data.categories || [],
      brands: response.data.brands || [],
      models: response.data.models || [],
      partTypes: response.data.partTypes || [],
    };
  },

  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.productsGET2(id);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch product');
    }

    return response.data as any;
  },

  async createProduct(product: CreateProductPayload): Promise<string> {
    const body: CreateProductRequestDto = {
      ...product,
      images: product.primaryImagePath
        ? [
            {
              filePath: product.primaryImagePath,
              altText: product.primaryImageAltText || undefined,
              isPrimary: true,
              sortOrder: 0,
            },
          ]
        : undefined,
    };

    const response = await apiClient.productsPOST(body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create product');
    }

    return response.data;
  },

  async adjustProductPricing(productId: string, body: AdjustProductPricingPayload) {
    const response = await apiClient.adjust2(productId, body as any);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to adjust product pricing');
    }

    return response.data;
  },
};
