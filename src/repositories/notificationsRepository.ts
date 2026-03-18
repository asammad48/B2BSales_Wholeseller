import { safeApiClient as apiClient } from './apiClientSafe';

export type NotificationType = 'LowStock' | 'System' | 'NewOrder' | 'Important';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
}

export const notificationsRepository = {
  async getNotifications(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<NotificationsResponse> {
    const normalizedSearch = search.trim() || undefined;
    const response = await apiClient.notifications(page, limit, normalizedSearch);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch notifications');
    }

    return {
      data: (response.data.items || []) as any[],
      total: response.data.totalCount || 0,
    };
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const response = await apiClient.read(id);
    if (!response.success) {
      throw new Error(response.message || 'Failed to mark notification as read');
    }
    return !!response.data;
  },

  async notifications(): Promise<NotificationsResponse> {
    return this.getNotifications();
  },
};
