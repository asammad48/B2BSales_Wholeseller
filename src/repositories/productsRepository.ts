import { axiosInstance } from '../api/client';
import { apiClient } from '../api/client';
import {
  AdjustProductPricingRequestDto,
  PricingMode,
  ProductDetailResponseDto,
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
  defaultSellingPrice?: number;
  defaultBuyingPrice?: number;
  defaultPricingMode?: PricingMode;
  defaultMarkupPercentage?: number;
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

export interface CreateProductImagePayload {
  file: File;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface CreateProductPayload {
  categoryId: string;
  brandId?: string;
  modelId?: string;
  partTypeId?: string;
  sku: string;
  barcode?: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  specifications?: string;
  trackingType: TrackingType;
  qualityType: QualityType;
  defaultBuyingPrice: number;
  defaultSellingPrice: number;
  defaultPricingMode: PricingMode;
  defaultMarkupPercentage?: number;
  warrantyDays: number;
  lowStockThreshold: number;
  images: CreateProductImagePayload[];
}

export interface ProductPricingPayload extends AdjustProductPricingRequestDto {
  productId: string;
}

const appendOptional = (formData: FormData, key: string, value: string | number | boolean | undefined) => {
  if (value === undefined || value === null || value === '') {
    return;
  }

  formData.append(key, String(value));
};

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

  async getProductById(id: string): Promise<ProductDetailResponseDto> {
    const response = await apiClient.productsGET2(id);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch product');
    }

    return response.data;
  },

  async createProduct(product: CreateProductPayload): Promise<string> {
    const formData = new FormData();

    appendOptional(formData, 'categoryId', product.categoryId);
    appendOptional(formData, 'brandId', product.brandId);
    appendOptional(formData, 'modelId', product.modelId);
    appendOptional(formData, 'partTypeId', product.partTypeId);
    appendOptional(formData, 'sku', product.sku);
    appendOptional(formData, 'barcode', product.barcode);
    appendOptional(formData, 'name', product.name);
    appendOptional(formData, 'shortDescription', product.shortDescription);
    appendOptional(formData, 'longDescription', product.longDescription);
    appendOptional(formData, 'specifications', product.specifications);
    appendOptional(formData, 'trackingType', product.trackingType);
    appendOptional(formData, 'qualityType', product.qualityType);
    appendOptional(formData, 'defaultBuyingPrice', product.defaultBuyingPrice);
    appendOptional(formData, 'defaultSellingPrice', product.defaultSellingPrice);
    appendOptional(formData, 'defaultPricingMode', product.defaultPricingMode);
    appendOptional(formData, 'defaultMarkupPercentage', product.defaultMarkupPercentage);
    appendOptional(formData, 'warrantyDays', product.warrantyDays);
    appendOptional(formData, 'lowStockThreshold', product.lowStockThreshold);

    product.images.forEach((image, index) => {
      formData.append(`images[${index}].file`, image.file);
      appendOptional(formData, `images[${index}].altText`, image.altText);
      appendOptional(formData, `images[${index}].isPrimary`, image.isPrimary);
      appendOptional(formData, `images[${index}].sortOrder`, image.sortOrder);
    });

    const response = await axiosInstance.post('/api/Products', formData, {
      headers: {
        Accept: 'text/plain',
      },
      transformResponse: [(data) => data],
    });

    const payload = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

    if (!payload?.success || !payload?.data) {
      throw new Error(payload?.message || 'Failed to create product');
    }

    return payload.data;
  },

  async updatePricing(payload: ProductPricingPayload) {
    const { productId, ...body } = payload;
    const response = await apiClient.adjust2(productId, body as AdjustProductPricingRequestDto);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update pricing');
    }

    return response.data;
  },
};
