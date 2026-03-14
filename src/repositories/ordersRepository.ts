import { apiClient } from '../api/generated/apiClient';

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
    return apiClient.ordersGET(page, limit, search);
  },

  async ready(id: string): Promise<Order> {
    return apiClient.readyPOST(id);
  },

  async complete(id: string): Promise<Order> {
    return apiClient.completePOST(id);
  },

  async unableToFulfill(id: string, reason: string): Promise<Order> {
    return apiClient.unableToFulfillPOST(id, { reason });
  },
};
