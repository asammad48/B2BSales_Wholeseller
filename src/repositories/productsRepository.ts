import { apiClient } from '../api/client';
import {
  AdjustProductPricingRequestDto,
  CreateProductImageRequestDto,
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

export interface CreateProductImageInput {
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
  defaultMarkupPercentage: number;
  warrantyDays: number;
  lowStockThreshold: number;
  images: CreateProductImageInput[];
}

const normalizeOptionalString = (value?: string) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const ensureSinglePrimaryImage = (images: CreateProductImageInput[]) => {
  const primaryImages = images.filter((image) => image.isPrimary);

  if (images.length === 0) {
    throw new Error('At least one product image is required');
  }

  if (primaryImages.length !== 1) {
    throw new Error('Exactly one product image must be marked as primary');
  }
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

  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.productsGET2(id);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch product');
    }

    return response.data as any;
  },

  async createProduct(product: CreateProductPayload): Promise<string> {
    ensureSinglePrimaryImage(product.images);

    const normalizedImages = product.images.map<CreateProductImageRequestDto>((image, index) => ({
      altText: normalizeOptionalString(image.altText),
      isPrimary: image.isPrimary,
      sortOrder: index,
      filePath: image.file.name,
    }));

    const response = await apiClient.productsPOST(
      product.categoryId,
      product.brandId ?? '',
      product.modelId ?? '',
      product.partTypeId ?? '',
      product.sku,
      product.barcode ?? '',
      product.name,
      product.shortDescription ?? '',
      product.longDescription ?? '',
      product.specifications ?? '',
      product.trackingType,
      product.qualityType,
      product.defaultBuyingPrice,
      product.defaultSellingPrice,
      product.defaultPricingMode,
      product.defaultMarkupPercentage,
      product.warrantyDays,
      product.lowStockThreshold,
      normalizedImages.map((image) => ({
        ...image,
        toString: () => JSON.stringify(image),
      })) as CreateProductImageRequestDto[],
      product.images.map((image) => ({
        data: image.file,
        fileName: image.file.name,
      }))
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
