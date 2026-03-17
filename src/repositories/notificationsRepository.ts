import { safeApiClient as apiClient } from './apiClientSafe';

export type NotificationType = 'LowStock' | 'System';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export const notificationsRepository = {
  async getNotifications(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<Notification[]> {
    const normalizedSearch = search.trim() || undefined;
    const response = await apiClient.notifications(page, limit, normalizedSearch);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch notifications');
    }

    return response.data.items as any[];
  },

  async notifications(): Promise<Notification[]> {
    return this.getNotifications();
  },
};
