import { apiClient } from '../api/client';

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
  async notifications(): Promise<Notification[]> {
    const response = await apiClient.notifications();
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch notifications');
    }

    return response.data.items as any[];
  },
};
