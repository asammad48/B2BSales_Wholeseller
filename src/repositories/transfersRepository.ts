import { safeApiClient as apiClient } from './apiClientSafe';
import { shopsRepository, ShopLookupItem } from './shopsRepository';

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
  productName?: string;
  quantity?: number;
}

export interface CreateTransferRequest {
  sourceShopId: string;
  destinationShopId: string;
  notes?: string;
  items?: Array<{ productId: string; quantity: number }>;
  productId?: string;
  quantity?: number;
}

export interface TransfersResponse {
  data: Transfer[];
  total: number;
}

export const transfersRepository = {
  async getTransfers(_page: number = 1, _limit: number = 10, _search: string = ''): Promise<TransfersResponse> {
    return {
      data: [],
      total: 0,
    };
  },

  async getShopsLookup(): Promise<ShopLookupItem[]> {
    return shopsRepository.getShopsLookup();
  },

  async createTransfer(body: CreateTransferRequest): Promise<Transfer> {
    const payload = {
      sourceShopId: body.sourceShopId,
      destinationShopId: body.destinationShopId,
      notes: body.notes,
      items: body.items || (body.productId && body.quantity
        ? [{ productId: body.productId, quantity: body.quantity }]
        : []),
    };

    const response = await apiClient.transfers(payload as any);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create transfer');
    }

    return { id: response.data, fromShopId: payload.sourceShopId, toShopId: payload.destinationShopId } as Transfer;
  },

  async dispatchTransfer(id: string): Promise<Transfer> {
    const response = await apiClient.dispatch(id);

    if (!response.success) {
      throw new Error(response.message || 'Failed to dispatch transfer');
    }

    return { id } as Transfer;
  },

  async receiveTransfer(id: string): Promise<Transfer> {
    const response = await apiClient.receive(id);

    if (!response.success) {
      throw new Error(response.message || 'Failed to receive transfer');
    }

    return { id } as Transfer;
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
