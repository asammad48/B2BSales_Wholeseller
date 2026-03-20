import { AdjustStockRequestDto, StockInRequestDto } from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  brandName: string;
  modelName: string;
  shopId: string;
  shopName: string;
  quantityOnHand: number;
  reservedQuantity: number;
  trackingType: string;
  lowStockThreshold: number;
}

export interface InventoryResponse {
  data: InventoryItem[];
  total: number;
  page: number;
  limit: number;
}

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
      data: (response.data.items || []) as any[],
      total: response.data.totalCount || 0,
      page: response.data.pageNumber || 1,
      limit: response.data.pageSize || 10,
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
