import { adminHttpClient, apiClient } from '../api/client';
import {
  AdjustProductPricingRequestDto,
  CreateProductImageRequestDto,
  GuidApiResponse,
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

const parseGuidResponse = (rawResponse: unknown): GuidApiResponse => {
  if (typeof rawResponse === 'string') {
    return JSON.parse(rawResponse) as GuidApiResponse;
  }

  return rawResponse as GuidApiResponse;
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
    if (!product.images.length) {
      throw new Error('At least one product image is required');
    }

    const formData = new FormData();
    const imageMetadata: CreateProductImageRequestDto[] = product.images.map((image, index) => ({
      altText: image.altText?.trim() || undefined,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder ?? index,
      filePath: image.file.name,
    }));

    formData.append('CategoryId', toRequiredString(product.categoryId));
    formData.append('BrandId', toRequiredString(product.brandId));
    formData.append('ModelId', toRequiredString(product.modelId));
    formData.append('PartTypeId', toRequiredString(product.partTypeId));
    formData.append('Sku', toRequiredString(product.sku));
    formData.append('Barcode', toRequiredString(product.barcode));
    formData.append('Name', toRequiredString(product.name));
    formData.append('ShortDescription', toRequiredString(product.shortDescription));
    formData.append('LongDescription', toRequiredString(product.longDescription));
    formData.append('Specifications', toRequiredString(product.specifications));
    formData.append('TrackingType', product.trackingType);
    formData.append('QualityType', product.qualityType);
    formData.append('DefaultBuyingPrice', String(toRequiredNumber(product.defaultBuyingPrice)));
    formData.append('DefaultSellingPrice', String(toRequiredNumber(product.defaultSellingPrice)));
    formData.append('DefaultPricingMode', product.defaultPricingMode || 'Direct');
    formData.append('DefaultMarkupPercentage', String(toRequiredNumber(product.defaultMarkupPercentage)));
    formData.append('WarrantyDays', String(toRequiredNumber(product.warrantyDays)));
    formData.append('LowStockThreshold', String(toRequiredNumber(product.lowStockThreshold)));

    imageMetadata.forEach((image) => {
      formData.append('Images', JSON.stringify(image));
    });

    product.images.forEach((image) => {
      formData.append('imageFiles', image.file, image.file.name);
    });

    const rawResponse = await adminHttpClient.post('/api/Products', formData, {
      headers: {
        Accept: 'text/plain',
      },
      transformResponse: [(data) => data],
    });

    const response = parseGuidResponse(rawResponse.data);

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
