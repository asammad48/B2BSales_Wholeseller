import {
  CreatePosOrderRequestDto,
  CreatePosOrderResponseDto,
  PosProductListItemDto,
  ProductBarcodeDto,
} from '../api/generated/apiClient';
import { apiClient } from '../api/client';
import { adminHttp, getApiErrorMessage, unwrapApiResponse } from './adminHttp';

export interface PosSerializedUnit {
  barcode: string;
  imei1: string;
  imei2: string;
}

export interface PosProduct {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  barcodes: PosSerializedUnit[];
  brandName?: string;
  modelName?: string;
  partTypeName?: string;
  primaryImageUrl?: string;
  sellingPrice: number;
  currencyCode: string;
  quantityInHand: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

export interface PosProductsQuery {
  shopId?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: string;
}

export interface PosProductsResponse {
  data: PosProduct[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
  message: string;
}

export interface CreatePosOrderBody extends CreatePosOrderRequestDto {
  shopId: string;
  clientId?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    barcodes?: string[];
  }>;
}

const mapSerializedUnit = (item?: ProductBarcodeDto | null): PosSerializedUnit => ({
  barcode: item?.barcode || '',
  imei1: item?.imei1 || '',
  imei2: item?.imei2 || '',
});

const hasSerializedIdentity = (item?: ProductBarcodeDto | null): boolean =>
  Boolean(item?.imei1?.trim() || item?.imei2?.trim());

const mapProductBarcodes = (item: PosProductListItemDto): PosSerializedUnit[] => {
  const source = item.barcodes || [];

  if (!source.length) {
    return [];
  }

  const hasAnySerializedUnit = source.length > 1 || source.some(hasSerializedIdentity);
  if (!hasAnySerializedUnit) {
    return [];
  }

  return source.map(mapSerializedUnit);
};

const mapPosProduct = (item: PosProductListItemDto): PosProduct => ({
  productId: item.productId || '',
  productName: item.productName || '',
  sku: item.sku || '',
  barcode: item.barcode,
  barcodes: mapProductBarcodes(item),
  brandName: item.brandName,
  modelName: item.modelName,
  partTypeName: item.partTypeName,
  primaryImageUrl: item.primaryImageUrl,
  sellingPrice: item.sellingPrice || 0,
  currencyCode: item.currencyCode || '',
  quantityInHand: item.quantityInHand || 0,
  lowStockThreshold: item.lowStockThreshold || 0,
  isLowStock: Boolean(item.isLowStock),
});

export const posOrdersRepository = {
  async products(params: PosProductsQuery = {}): Promise<PosProductsResponse> {
    const response = await apiClient.productsGET(
      params.shopId,
      params.page || 1,
      params.limit || 100,
      params.search?.trim() || undefined,
      params.sortBy,
      params.sortDirection
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch stocked POS products');
    }

    return {
      data: (response.data.items || []).map(mapPosProduct),
      total: response.data.totalCount || 0,
      page: response.data.pageNumber || params.page || 1,
      limit: response.data.pageSize || params.limit || 100,
      success: Boolean(response.success),
      message: response.message || '',
    };
  },

  async getPosProducts(params: PosProductsQuery = {}): Promise<PosProductsResponse> {
    return posOrdersRepository.products(params);
  },

  async createPosOrder(body: CreatePosOrderBody): Promise<CreatePosOrderResponseDto> {
    try {
      const response = await adminHttp.post('/api/pos/orders', body);
      return unwrapApiResponse<CreatePosOrderResponseDto>(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create POS order'));
    }
  },
};
