import { apiClient } from '../api/generated/apiClient';

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
    return apiClient.notificationsGET();
  },
};
