import { apiClient } from '../api/client';

export type OrderStatus = 'Pending' | 'ReadyForPickup' | 'Completed' | 'Cancelled' | 'UnableToFulfill';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
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

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export const ordersRepository = {
  async getOrders(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<OrdersResponse> {
    const normalizedSearch = search.trim() || undefined;
    const response = await apiClient.ordersGET(page, limit, normalizedSearch);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch orders');
    }

    return {
      data: (response.data.items || []) as any[],
      total: response.data.totalCount || 0,
      page: response.data.pageNumber || 1,
      limit: response.data.pageSize || 10
    };
  },

  async markReady(id: string): Promise<Order> {
    const response = await apiClient.ready(id);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to mark order as ready');
    }

    return response.data as any;
  },

  async completeOrder(id: string): Promise<Order> {
    const response = await apiClient.complete(id);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to complete order');
    }

    return response.data as any;
  },

  async markUnableToFulfill(id: string, reason: string): Promise<Order> {
    const response = await apiClient.unableToFulfill(id, { reason } as any);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to mark order as unable to fulfill');
    }

    return response.data as any;
  },

  async ready(id: string): Promise<Order> {
    return this.markReady(id);
  },

  async complete(id: string): Promise<Order> {
    return this.completeOrder(id);
  },

  async unableToFulfill(id: string, reason: string): Promise<Order> {
    return this.markUnableToFulfill(id, reason);
  },
};
