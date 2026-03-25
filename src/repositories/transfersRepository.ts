import {
  CreateStockTransferRequestDto,
  ProductLookupResponseDto,
  ProcessStockTransferRequestDto,
  StockTransferItemResponseDto,
  StockTransferListItemResponseDto,
  StockTransferStatus,
} from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';
import { InventoryItem, inventoryRepository } from './inventoryRepository';
import { shopsRepository, ShopLookupItem } from './shopsRepository';

export type TransferStatus = 'Pending' | 'Dispatched' | 'Received' | 'Cancelled';

export interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
  barcodes?: string[];
}

export interface Transfer {
  id: string;
  fromShopId: string;
  fromShopName: string;
  toShopId: string;
  toShopName: string;
  status: TransferStatus;
  createdAt: string;
  notes?: string;
  items: TransferItem[];
  productName?: string;
  quantity?: number;
}

export interface CreateTransferItemRequest {
  productId: string;
  quantity: number;
  barcodes?: string[];
}

export interface CreateTransferRequest extends CreateStockTransferRequestDto {
  sourceShopId: string;
  destinationShopId: string;
  notes?: string;
  items: CreateTransferItemRequest[];
}

export interface TransferProductLookup extends ProductLookupResponseDto {
  trackingType: string;
  quantityInHand: number;
  availableQuantity: number;
  sourceShopId: string;
  sourceShopName: string;
  serializedBarcodes: string[];
}

export interface TransferFormLookups {
  shops: ShopLookupItem[];
  products: TransferProductLookup[];
}

export interface TransfersResponse {
  data: Transfer[];
  total: number;
}

const mapTransferStatus = (status?: StockTransferStatus): TransferStatus => {
  switch (status) {
    case 'Draft':
      return 'Pending';
    case 'Dispatched':
      return 'Dispatched';
    case 'Received':
      return 'Received';
    case 'Cancelled':
      return 'Cancelled';
    default:
      return 'Pending';
  }
};

const mapTransferItems = (items?: StockTransferItemResponseDto[]): TransferItem[] =>
  (items || []).map((item) => ({
    productId: item.productId || '',
    productName: item.productName || '',
    quantity: item.quantity || 0,
    barcodes: item.barcodes || [],
  }));

const mapTransfer = (item: StockTransferListItemResponseDto): Transfer => {
  const items = mapTransferItems(item.items);
  const firstItem = items[0];

  return {
    id: item.id || '',
    fromShopId: item.sourceShopId || '',
    fromShopName: item.sourceShopName || '',
    toShopId: item.destinationShopId || '',
    toShopName: item.destinationShopName || '',
    status: mapTransferStatus(item.status),
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    notes: item.notes || '',
    items,
    productName: firstItem?.productName || '-',
    quantity: firstItem?.quantity || 0,
  };
};

const mapTransferProduct = (item: InventoryItem): TransferProductLookup => ({
  id: item.productId,
  name: item.productName,
  sku: item.sku,
  brandName: item.brandName,
  modelName: item.modelName,
  barcode: item.barcode,
  isActive: true,
  trackingType: item.trackingType,
  quantityInHand: item.quantityOnHand,
  availableQuantity: item.availableQuantity,
  sourceShopId: item.shopId,
  sourceShopName: item.shopName,
  serializedBarcodes: item.barcodes.map((barcode) => barcode.barcode).filter(Boolean),
});

const toProcessTransferBody = (transfer: Transfer): ProcessStockTransferRequestDto => ({
  items: transfer.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    barcodes: item.barcodes,
  })),
});

export const transfersRepository = {
  async getTransfers(page: number = 1, limit: number = 10, search: string = ''): Promise<TransfersResponse> {
    const normalizedSearch = search.trim() || undefined;
    const response = await apiClient.getStockTransfer(page, limit, normalizedSearch);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch transfers');
    }

    return {
      data: (response.data.items || []).map(mapTransfer),
      total: response.data.totalCount || 0,
    };
  },

  async getShopsLookup(): Promise<ShopLookupItem[]> {
    return shopsRepository.getShopsLookup();
  },

  async getCreateTransferLookups(): Promise<TransferFormLookups> {
    const [shops, inventoryResponse] = await Promise.all([
      this.getShopsLookup(),
      inventoryRepository.getInventory(1, 1000, ''),
    ]);

    return {
      shops,
      products: inventoryResponse.data
        .filter((item) => item.productId && item.shopId && item.availableQuantity > 0)
        .map(mapTransferProduct),
    };
  },

  async createTransfer(body: CreateTransferRequest): Promise<Transfer> {
    const response = await apiClient.transfers(body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create transfer');
    }

    return { id: response.data, fromShopId: body.sourceShopId, toShopId: body.destinationShopId } as Transfer;
  },

  async dispatchTransfer(transfer: Transfer): Promise<Transfer> {
    const response = await apiClient.dispatchTransfer(transfer.id, toProcessTransferBody(transfer));

    if (!response.success) {
      throw new Error(response.message || 'Failed to dispatch transfer');
    }

    return { id: transfer.id } as Transfer;
  },

  async receiveTransfer(transfer: Transfer): Promise<Transfer> {
    const response = await apiClient.receiveTransfer(transfer.id, toProcessTransferBody(transfer));

    if (!response.success) {
      throw new Error(response.message || 'Failed to receive transfer');
    }

    return { id: transfer.id } as Transfer;
  },

  async transfers(body: CreateTransferRequest): Promise<Transfer> {
    return this.createTransfer(body);
  },

  async dispatch(transfer: Transfer): Promise<Transfer> {
    return this.dispatchTransfer(transfer);
  },

  async receive(transfer: Transfer): Promise<Transfer> {
    return this.receiveTransfer(transfer);
  },
};
