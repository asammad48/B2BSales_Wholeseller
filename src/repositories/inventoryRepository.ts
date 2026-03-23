import {
  AdjustStockRequestDto,
  InventoryListItemResponseDto,
  ProductBarcodeDto,
  StockInRequestDto,
} from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';

export interface SerializedInventoryUnit {
  barcode: string;
  imei1: string;
  imei2: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  barcodes: SerializedInventoryUnit[];
  brandName: string;
  modelName: string;
  shopId: string;
  shopName: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  trackingType: string;
  lowStockThreshold: number;
}

export interface InventoryResponse {
  data: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
  message: string;
}

const mapSerializedUnit = (unit?: ProductBarcodeDto | null): SerializedInventoryUnit => ({
  barcode: unit?.barcode || '',
  imei1: unit?.imei1 || '',
  imei2: unit?.imei2 || '',
});

const mapInventoryItem = (item: InventoryListItemResponseDto): InventoryItem => ({
  id: `${item.productId || ''}-${item.shopId || ''}`,
  productId: item.productId || '',
  productName: item.productName || '',
  sku: item.sku || '',
  barcode: item.barcode || '',
  barcodes: (item.barcodes || []).map(mapSerializedUnit),
  brandName: item.brandName || '',
  modelName: item.modelName || '',
  shopId: item.shopId || '',
  shopName: item.shopName || '',
  quantityOnHand: item.quantityOnHand || 0,
  reservedQuantity: item.reservedQuantity || 0,
  availableQuantity: item.availableQuantity ?? Math.max((item.quantityOnHand || 0) - (item.reservedQuantity || 0), 0),
  trackingType: item.trackingType || 'QuantityBased',
  lowStockThreshold: item.lowStockThreshold || 0,
});

export const inventoryRepository = {
  async getInventory(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<InventoryResponse> {
    const normalizedSearch = search.trim() || undefined;
    const response = await apiClient.inventory(page, limit, normalizedSearch);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch inventory');
    }

    return {
      data: (response.data.items || []).map(mapInventoryItem),
      total: response.data.totalCount || 0,
      page: response.data.pageNumber || 1,
      limit: response.data.pageSize || 10,
      success: Boolean(response.success),
      message: response.message || '',
    };
  },

  async createStockIn(body: StockInRequestDto): Promise<string> {
    const response = await apiClient.stockIn(body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to stock in');
    }

    return response.data;
  },

  async adjustStock(body: AdjustStockRequestDto): Promise<string> {
    const response = await apiClient.adjust(body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to adjust inventory');
    }

    return response.data;
  },

  async stockIn(body: StockInRequestDto): Promise<string> {
    return this.createStockIn(body);
  },

  async adjust(body: AdjustStockRequestDto): Promise<string> {
    return this.adjustStock(body);
  },
};
