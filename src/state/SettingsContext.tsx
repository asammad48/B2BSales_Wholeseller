import React, { createContext, useContext, useState, useEffect } from 'react';
import { tenantRepository, TenantSettings } from '../repositories/tenantRepository';

interface SettingsContextType {
  settings: TenantSettings | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<TenantSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await tenantRepository.getSettings();
      setSettings(data);
      
      // Apply theme colors to CSS variables
      if (data) {
        document.documentElement.style.setProperty('--primary-color', data.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', data.secondaryColor);
        document.documentElement.style.setProperty('--accent-color', data.accentColor);
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<TenantSettings>) => {
    try {
      const updated = await tenantRepository.updateSettings(newSettings);
      setSettings(updated);
      
      if (updated) {
        document.documentElement.style.setProperty('--primary-color', updated.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', updated.secondaryColor);
        document.documentElement.style.setProperty('--accent-color', updated.accentColor);
      }
    } catch (error) {
      console.error('Failed to update settings', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
