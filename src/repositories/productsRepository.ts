import { apiClient } from '../api/client';
import {
  AdjustProductPricingRequestDto,
  CreateProductImageRequestDto,
  FileParameter,
  PricingMode,
  ProductPricingAdjustmentResultDto,
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
  defaultBuyingPrice?: number;
  defaultSellingPrice?: number;
  defaultPricingMode?: PricingMode;
  defaultMarkupPercentage?: number;
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

export interface CreateProductImageUpload {
  file: File;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface CreateProductPayload {
  categoryId?: string;
  brandId?: string;
  modelId?: string;
  partTypeId?: string;
  sku?: string;
  barcode?: string;
  name?: string;
  shortDescription?: string;
  longDescription?: string;
  specifications?: string;
  trackingType: TrackingType;
  qualityType: QualityType;
  defaultBuyingPrice?: number;
  defaultSellingPrice?: number;
  defaultPricingMode?: PricingMode;
  defaultMarkupPercentage?: number;
  warrantyDays?: number;
  lowStockThreshold?: number;
  images: CreateProductImageUpload[];
}

const toRequiredString = (value?: string) => value?.trim() ?? '';

const toRequiredNumber = (value?: number) => value ?? 0;

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
    if (!product.images.length) {
      throw new Error('At least one product image is required');
    }

    const imageMetadata: CreateProductImageRequestDto[] = product.images.map((image, index) => ({
      altText: image.altText?.trim() || undefined,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder ?? index,
      filePath: image.file.name,
    }));

    const imageFiles = product.images.map((image, index) => ({
      data: image.file,
      fileName: image.file.name,
      toString: () => JSON.stringify(imageMetadata[index]),
    })) as Array<FileParameter & { toString: () => string }>;

    const response = await (apiClient as any).productsPOST(
      toRequiredString(product.categoryId),
      toRequiredString(product.brandId),
      toRequiredString(product.modelId),
      toRequiredString(product.partTypeId),
      toRequiredString(product.sku),
      toRequiredString(product.barcode),
      toRequiredString(product.name),
      toRequiredString(product.shortDescription),
      toRequiredString(product.longDescription),
      toRequiredString(product.specifications),
      product.trackingType,
      product.qualityType,
      toRequiredNumber(product.defaultBuyingPrice),
      toRequiredNumber(product.defaultSellingPrice),
      product.defaultPricingMode,
      toRequiredNumber(product.defaultMarkupPercentage),
      toRequiredNumber(product.warrantyDays),
      toRequiredNumber(product.lowStockThreshold),
      imageFiles,
      imageFiles
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create product');
    }

    return response.data;
  },

  async adjustProductPricing(productId: string, body: AdjustProductPricingRequestDto): Promise<ProductPricingAdjustmentResultDto> {
    const response = await apiClient.adjust2(productId, body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to adjust product pricing');
    }

    return response.data;
  },
};
