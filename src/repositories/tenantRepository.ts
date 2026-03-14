import { apiClient } from '../api/generated/apiClient';

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
    return apiClient.currentGET();
  },

  async updateSettings(settings: Partial<TenantSettings>): Promise<TenantSettings> {
    return apiClient.currentPUT(settings);
  }
};
