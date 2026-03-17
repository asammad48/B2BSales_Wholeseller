import { apiClient } from '../api/client';
import { UpdateThemeRequestDto } from '../api/generated/apiClient';

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export const themeRepository = {
  async getCurrentTheme(): Promise<ThemeSettings> {
    const response = await apiClient.currentGET();
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch theme');
    }
    return {
      primaryColor: response.data.primaryColor || '#10b981',
      secondaryColor: response.data.secondaryColor || '#0f172a',
      accentColor: response.data.accentColor || '#06b6d4',
    };
  },

  async updateTheme(settings: ThemeSettings): Promise<void> {
    const request: UpdateThemeRequestDto = {
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
    };
    const response = await apiClient.currentPUT(request);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update theme');
    }
  },

  async updateCurrentTheme(settings: ThemeSettings): Promise<void> {
    return this.updateTheme(settings);
  },

  async getPublicTheme(): Promise<ThemeSettings> {
    const response = await apiClient.theme();
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch public theme');
    }
    return {
      primaryColor: response.data.primaryColor || '#10b981',
      secondaryColor: response.data.secondaryColor || '#0f172a',
      accentColor: response.data.accentColor || '#06b6d4',
    };
  }
};
