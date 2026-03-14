import { apiClient } from '../api/generated/apiClient';

export type TransferStatus = 'Pending' | 'Dispatched' | 'Received' | 'Cancelled';

export interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface Transfer {
  id: string;
  fromShopId: string;
  fromShopName: string;
  toShopId: string;
  toShopName: string;
  status: TransferStatus;
  createdAt: string;
  items: TransferItem[];
  // Flattened for simple display if needed
  productName?: string;
  quantity?: number;
}

export interface CreateTransferRequest {
  fromShopId: string;
  toShopId: string;
  items?: TransferItem[];
  // For simple creation
  productId?: string;
  quantity?: number;
}

export interface TransfersResponse {
  data: Transfer[];
  total: number;
}

export const transfersRepository = {
  async getTransfers(page: number = 1, limit: number = 10, search: string = ''): Promise<TransfersResponse> {
    const data = await apiClient.transfersGET();
    // Flatten for simple display in table
    const flattenedData = data.map((t: any) => ({
      ...t,
      productName: t.items?.[0]?.productName || 'Multiple Items',
      quantity: t.items?.[0]?.quantity || 0
    }));
    return {
      data: flattenedData,
      total: flattenedData.length
    };
  },

  async transfers(body: CreateTransferRequest): Promise<Transfer> {
    // Ensure items is populated if using simple fields
    if (body.productId && body.quantity && !body.items) {
      body.items = [{
        productId: body.productId,
        quantity: body.quantity,
        productName: ''
      }];
    }
    return apiClient.transfersPOST(body);
  },

  async dispatch(id: string): Promise<Transfer> {
    return apiClient.dispatchPOST(id);
  },

  async receive(id: string): Promise<Transfer> {
    return apiClient.receivePOST(id);
  },
};
