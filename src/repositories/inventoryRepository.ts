import { apiClient } from '../api/generated/apiClient';

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
    return apiClient.inventoryGET(page, limit, search);
  },

  async stockIn(body: { productId: string; shopId: string; quantity: number; trackingType?: string }): Promise<InventoryItem> {
    return apiClient.stockInPOST(body);
  },

  async adjust(body: { id: string; adjustment: number; reason: string }): Promise<InventoryItem> {
    return apiClient.adjustPOST(body);
  }
};
