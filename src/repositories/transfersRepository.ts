import { apiClient } from '../api/client';

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
    // Note: transfersGET is missing from generated client, returning empty for now
    return {
      data: [],
      total: 0
    };
  },

  async createTransfer(body: CreateTransferRequest): Promise<Transfer> {
    // Ensure items is populated if using simple fields
    if (body.productId && body.quantity && !body.items) {
      body.items = [{
        productId: body.productId,
        quantity: body.quantity,
        productName: ''
      }];
    }
    const response = await apiClient.transfers(body as any);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create transfer');
    }

    return response.data as any;
  },

  async dispatchTransfer(id: string): Promise<Transfer> {
    const response = await apiClient.dispatch(id);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to dispatch transfer');
    }

    return response.data as any;
  },

  async receiveTransfer(id: string): Promise<Transfer> {
    const response = await apiClient.receive(id);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to receive transfer');
    }

    return response.data as any;
  },

  async transfers(body: CreateTransferRequest): Promise<Transfer> {
    return this.createTransfer(body);
  },

  async dispatch(id: string): Promise<Transfer> {
    return this.dispatchTransfer(id);
  },

  async receive(id: string): Promise<Transfer> {
    return this.receiveTransfer(id);
  },
};
