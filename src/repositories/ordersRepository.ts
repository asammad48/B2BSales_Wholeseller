import {
  CreateOrderItemRequestDto,
  CreateOrderRequestDto,
  CurrencyLookupResponseDto,
  LookupBundleResponseDto,
  OrderDetailsDto,
  ProductLookupResponseDto,
  ShopLookupResponseDto,
} from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';
import { adminHttp, getApiErrorMessage } from './adminHttp';

export type OrderStatus = 'Pending' | 'ReadyForPickup' | 'Completed' | 'Cancelled' | 'UnableToFulfill';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderBody extends CreateOrderRequestDto {
  clientId: string;
  shopId: string;
  currencyId: string;
  exchangeRate: number;
  items: CreateOrderItemRequestDto[];
}

export interface OrderFormLookups {
  clients: Array<{ id: string; name: string }>;
  shops: ShopLookupResponseDto[];
  products: ProductLookupResponseDto[];
  currencies: CurrencyLookupResponseDto[];
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  shopId: string;
  shopName: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderDetailsItem {
  orderItemId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderDetails {
  orderId: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  businessName: string;
  shopId: string;
  shopName: string;
  status: string;
  statusLabel: string;
  currencyCode: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string;
  createdAt: string;
  readyAt?: string;
  completedAt?: string;
  items: OrderDetailsItem[];
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderInvoicePdf {
  blob: Blob;
  fileName: string;
}

const mapOrderDetails = (item: OrderDetailsDto): OrderDetails => ({
  orderId: item.orderId || '',
  orderNumber: item.orderNumber || '',
  clientId: item.clientId || '',
  clientName: item.clientName || '',
  businessName: item.businessName || '',
  shopId: item.shopId || '',
  shopName: item.shopName || '',
  status: item.status || 'Pending',
  statusLabel: item.statusLabel || item.status || 'Pending',
  currencyCode: item.currencyCode || '',
  subtotal: item.subtotal || 0,
  discountAmount: item.discountAmount || 0,
  taxAmount: item.taxAmount || 0,
  totalAmount: item.totalAmount || 0,
  notes: item.notes || '',
  createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
  readyAt: item.readyAt ? new Date(item.readyAt).toISOString() : undefined,
  completedAt: item.completedAt ? new Date(item.completedAt).toISOString() : undefined,
  items: (item.items || []).map((detail) => ({
    orderItemId: detail.orderItemId || '',
    productId: detail.productId || '',
    productName: detail.productName || '',
    sku: detail.sku || '',
    quantity: detail.quantity || 0,
    unitPrice: detail.unitPrice || 0,
    lineTotal: detail.lineTotal || 0,
  })),
});

export const ordersRepository = {
  async getOrders(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<OrdersResponse> {
    const normalizedSearch = search.trim() || undefined;
    const response = await apiClient.adminOrders(page, limit, normalizedSearch);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch orders');
    }

    return {
      data: (response.data.items || []).map((item) => ({
        id: item.id || '',
        orderNumber: item.orderNumber || '',
        clientId: item.clientId || '',
        clientName: item.clientName || '',
        shopId: item.shopId || '',
        shopName: item.shopName || '',
        status: (item.status || 'Pending') as OrderStatus,
        totalAmount: item.totalAmount || 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
        items: [],
      })),
      total: response.data.totalCount || 0,
      page: response.data.pageNumber || 1,
      limit: response.data.pageSize || 10,
    };
  },

  async getOrderDetails(id: string): Promise<OrderDetails> {
    const response = await apiClient.getOrderById(id);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch order details');
    }

    return mapOrderDetails(response.data);
  },

  async markReady(id: string): Promise<string> {
    const response = await apiClient.ready(id);

    if (!response) {
      return 'Order marked as ready';
    }

    if (!response.success) {
      throw new Error(response.message || 'Failed to mark order as ready');
    }

    return response.data || response.message || 'Order marked as ready';
  },

  async completeOrder(id: string): Promise<string> {
    const response = await apiClient.complete(id);

    if (!response) {
      return 'Order completed';
    }

    if (!response.success) {
      throw new Error(response.message || 'Failed to complete order');
    }

    return response.data || response.message || 'Order completed';
  },

  async markUnableToFulfill(id: string, reason: string): Promise<string> {
    const response = await apiClient.unableToFulfill(id, { reason } as any);

    if (!response) {
      return 'Order updated';
    }

    if (!response.success) {
      throw new Error(response.message || 'Failed to mark order as unable to fulfill');
    }

    return response.data || response.message || 'Order updated';
  },

  async createOrder(body: CreateOrderBody): Promise<string> {
    const response = await apiClient.orders(body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create order');
    }

    return response.data.orderId || '';
  },

  async downloadOrderInvoicePdf(orderId: string): Promise<OrderInvoicePdf> {
    try {
      const response = await adminHttp.get(`/api/pos/orders/${encodeURIComponent(orderId)}/invoice-pdf`, {
        responseType: 'blob',
      });

      const disposition = response.headers['content-disposition'] as string | undefined;
      const fileName = disposition?.match(/filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i)?.slice(1).find(Boolean);

      return {
        blob: response.data as Blob,
        fileName: fileName ? decodeURIComponent(fileName) : `order-${orderId}-invoice.pdf`,
      };
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to download invoice PDF'));
    }
  },

  async getCreateOrderLookups(): Promise<OrderFormLookups> {
    const bundleResponse = await apiClient.bundle();

    if (!bundleResponse.success || !bundleResponse.data) {
      throw new Error(bundleResponse.message || 'Failed to fetch order lookups');
    }

    const bundle: LookupBundleResponseDto = bundleResponse.data;

    return {
      clients: (bundle.clients || []).map((client) => ({
        id: client.id || '',
        name: client.name || '',
      })),
      shops: bundle.shops || [],
      products: bundle.products || [],
      currencies: bundle.currencies || [],
    };
  },

  async ready(id: string): Promise<string> {
    return this.markReady(id);
  },

  async complete(id: string): Promise<string> {
    return this.completeOrder(id);
  },

  async unableToFulfill(id: string, reason: string): Promise<string> {
    return this.markUnableToFulfill(id, reason);
  },

  async ordersPOST(body: CreateOrderBody): Promise<string> {
    return this.createOrder(body);
  },
};
