import { apiClient } from '../api/client';
import {
  CreateProductImageRequestDto,
  CurrencyLookupResponseDto,
  PricingMode,
  ProductPricingAdjustmentResultDto,
  PublicLookupItemDto,
  QualityType,
  TrackingType,
} from '../api/generated/apiClient';
import { adminHttp, getApiErrorMessage, unwrapApiResponse } from './adminHttp';
import { lookupsRepository } from './lookupsRepository';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  brandName: string;
  modelName: string;
  categoryName: string;
  basePrice: number;
  baseCurrencyId?: string;
  baseCurrencyCode?: string;
  defaultBuyingPrice?: number;
  defaultSellingPrice?: number;
  defaultPricingMode?: PricingMode;
  defaultMarkupPercentage?: number;
  isActive: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
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
  currencies: CurrencyLookupResponseDto[];
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
  baseCurrencyId: string;
  basePrice: number;
  pricingMode: PricingMode;
  sellingPrice: number;
  markupPercentage?: number;
  warrantyDays: number;
  lowStockThreshold: number;
  images: CreateProductImageInput[];
}

export interface AdjustProductPricingPayload {
  buyingPrice?: number;
  baseCurrencyId: string;
  basePrice: number;
  pricingMode: PricingMode;
  sellingPrice: number;
  markupPercentage?: number;
  reason?: string;
  updateDefaultPrice?: boolean;
}

export interface UpdateProductFlagsPayload {
  isFeatured?: boolean;
  isNewArrival?: boolean;
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

const appendIfPresent = (formData: FormData, key: string, value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') {
    return;
  }

  formData.append(key, String(value));
};

export const productsRepository = {
  async products(
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
      data: ((response.data.items || []) as any[]).map((item) => ({
        ...item,
        id: item.id || '',
        name: item.name || '',
        sku: item.sku || '',
        barcode: item.barcode || '',
        brandName: item.brandName || '',
        modelName: item.modelName || '',
        categoryName: item.categoryName || '',
        basePrice: Number(item.basePrice || item.defaultBuyingPrice || 0),
        baseCurrencyId: item.baseCurrencyId,
        baseCurrencyCode: item.baseCurrencyCode,
        defaultBuyingPrice: Number(item.defaultBuyingPrice || 0),
        defaultSellingPrice: Number(item.defaultSellingPrice || 0),
        defaultPricingMode: item.defaultPricingMode,
        defaultMarkupPercentage: item.defaultMarkupPercentage,
        isActive: Boolean(item.isActive),
        isFeatured: Boolean(item.isFeatured),
        isNewArrival: Boolean(item.isNewArrival),
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      })),
      total: response.data.totalCount || 0,
      page: response.data.pageNumber || 1,
      limit: response.data.pageSize || 10,
    };
  },

  async getCatalogLookups(): Promise<CatalogLookups> {
    const [catalogResponse, bundleResponse] = await Promise.all([
      apiClient.lookups(),
      lookupsRepository.getBundle(),
    ]);

    if (!catalogResponse.success || !catalogResponse.data) {
      throw new Error(catalogResponse.message || 'Failed to fetch catalog lookups');
    }

    return {
      categories: catalogResponse.data.categories || [],
      brands: catalogResponse.data.brands || [],
      models: catalogResponse.data.models || [],
      partTypes: catalogResponse.data.partTypes || [],
      currencies: bundleResponse.currencies || [],
    };
  },

  async publicProductsGET(id: string): Promise<Product> {
    const response = await apiClient.productsGET2(id);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch product');
    }

    return response.data as any;
  },

  async getProducts(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    sortBy: string = 'createdAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<ProductsResponse> {
    return productsRepository.products(page, limit, search, sortBy, sortDirection);
  },

  async getProductById(id: string): Promise<Product> {
    return productsRepository.publicProductsGET(id);
  },

  async createProduct(product: CreateProductPayload): Promise<string> {
    ensureSinglePrimaryImage(product.images);

    const normalizedImages = product.images.map<CreateProductImageRequestDto>((image, index) => ({
      altText: normalizeOptionalString(image.altText),
      isPrimary: image.isPrimary,
      sortOrder: index,
      filePath: image.file.name,
    }));

    const formData = new FormData();
    appendIfPresent(formData, 'CategoryId', product.categoryId);
    appendIfPresent(formData, 'BrandId', product.brandId);
    appendIfPresent(formData, 'ModelId', product.modelId);
    appendIfPresent(formData, 'PartTypeId', product.partTypeId);
    appendIfPresent(formData, 'Sku', product.sku);
    appendIfPresent(formData, 'Barcode', product.barcode);
    appendIfPresent(formData, 'Name', product.name);
    appendIfPresent(formData, 'ShortDescription', product.shortDescription);
    appendIfPresent(formData, 'LongDescription', product.longDescription);
    appendIfPresent(formData, 'Specifications', product.specifications);
    appendIfPresent(formData, 'TrackingType', product.trackingType);
    appendIfPresent(formData, 'QualityType', product.qualityType);
    appendIfPresent(formData, 'DefaultBuyingPrice', product.defaultBuyingPrice);
    appendIfPresent(formData, 'DefaultSellingPrice', product.sellingPrice);
    appendIfPresent(formData, 'DefaultPricingMode', product.pricingMode);
    appendIfPresent(formData, 'DefaultMarkupPercentage', product.markupPercentage ?? 0);
    appendIfPresent(formData, 'BaseCurrencyId', product.baseCurrencyId);
    appendIfPresent(formData, 'BasePrice', product.basePrice);
    appendIfPresent(formData, 'PricingMode', product.pricingMode);
    appendIfPresent(formData, 'SellingPrice', product.sellingPrice);
    appendIfPresent(formData, 'MarkupPercentage', product.markupPercentage ?? 0);
    appendIfPresent(formData, 'WarrantyDays', product.warrantyDays);
    appendIfPresent(formData, 'LowStockThreshold', product.lowStockThreshold);

    normalizedImages.forEach((image, index) => {
      formData.append(`Images[${index}].FilePath`, image.filePath || '');
      formData.append(`Images[${index}].AltText`, image.altText || '');
      formData.append(`Images[${index}].IsPrimary`, String(Boolean(image.isPrimary)));
      formData.append(`Images[${index}].SortOrder`, String(image.sortOrder || 0));
    });

    product.images.forEach((image) => {
      formData.append('ImageFiles', image.file, image.file.name);
    });

    try {
      const response = await adminHttp.post('/api/Products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'text/plain',
        },
      });

      return unwrapApiResponse<string>(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create product'));
    }
  },

  async adjustProductPricing(productId: string, body: AdjustProductPricingPayload): Promise<ProductPricingAdjustmentResultDto> {
    try {
      const response = await adminHttp.post(`/api/Products/${encodeURIComponent(productId)}/pricing/adjust`, {
        buyingPrice: body.buyingPrice,
        baseCurrencyId: body.baseCurrencyId,
        basePrice: body.basePrice,
        pricingMode: body.pricingMode,
        sellingPrice: body.sellingPrice,
        markupPercentage: body.markupPercentage,
        reason: body.reason,
        updateDefaultPrice: body.updateDefaultPrice,
      }, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
      });

      return unwrapApiResponse<ProductPricingAdjustmentResultDto>(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to adjust product pricing'));
    }
  },

  async updateProductFlags(productId: string, body: UpdateProductFlagsPayload): Promise<void> {
    const response = await apiClient.flags(productId, {
      isFeatured: body.isFeatured,
      isNewArrival: body.isNewArrival,
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update product flags');
    }
  },
};
