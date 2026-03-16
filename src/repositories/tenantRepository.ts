import { apiClient } from '../api/client';

export interface TenantSettings {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  currency: string;
  language: string;
}

export const tenantRepository = {
  async getSettings(): Promise<TenantSettings> {
    const response = await apiClient.currentGET();
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch settings');
    }

    return response.data as any;
  },

  async updateSettings(settings: Partial<TenantSettings>): Promise<TenantSettings> {
    const response = await apiClient.currentPUT(settings as any);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update settings');
    }

    return response.data as any;
  }
};
