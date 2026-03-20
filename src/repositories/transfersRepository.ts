import {
  CreateStockTransferRequestDto,
  ProductLookupResponseDto,
} from '../api/generated/apiClient';
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

export interface CreateTransferRequest extends CreateStockTransferRequestDto {
  sourceShopId: string;
  destinationShopId: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface TransferFormLookups {
  shops: ShopLookupItem[];
  products: ProductLookupResponseDto[];
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

  async getCreateTransferLookups(): Promise<TransferFormLookups> {
    const [shops, bundleResponse] = await Promise.all([
      this.getShopsLookup(),
      apiClient.bundle(),
    ]);

    if (!bundleResponse.success || !bundleResponse.data) {
      throw new Error(bundleResponse.message || 'Failed to fetch transfer lookups');
    }

    return {
      shops,
      products: bundleResponse.data.products || [],
    };
  },

  async createTransfer(body: CreateTransferRequest): Promise<Transfer> {
    const response = await apiClient.transfers(body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create transfer');
    }

    return { id: response.data, fromShopId: body.sourceShopId, toShopId: body.destinationShopId } as Transfer;
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
