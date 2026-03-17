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
      limit: response.data.pageSize || 10
    };
  },

  async createStockIn(body: { productId: string; shopId: string; quantity: number; trackingType?: string }): Promise<InventoryItem> {
    const response = await apiClient.stockIn(body as any);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to stock in');
    }

    return response.data as any;
  },

  async adjustStock(body: { id: string; adjustment: number; reason: string }): Promise<InventoryItem> {
    const response = await apiClient.adjust(body as any);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to adjust inventory');
    }

    return response.data as any;
  },

  async stockIn(body: { productId: string; shopId: string; quantity: number; trackingType?: string }): Promise<InventoryItem> {
    return this.createStockIn(body);
  },

  async adjust(body: { id: string; adjustment: number; reason: string }): Promise<InventoryItem> {
    return this.adjustStock(body);
  }
};
