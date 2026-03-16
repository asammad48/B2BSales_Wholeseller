import React, { createContext, useContext, useEffect, useState } from 'react';
import { themeRepository, ThemeSettings } from '../repositories/themeRepository';

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (newTheme: ThemeSettings) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within an AdminThemeProvider');
  return context;
};

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings>({
    primaryColor: '#10b981',
    secondaryColor: '#0f172a',
    accentColor: '#06b6d4',
  });
  const [isLoading, setIsLoading] = useState(true);

  const applyTheme = (settings: ThemeSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings.primaryColor);
    root.style.setProperty('--color-secondary', settings.secondaryColor);
    root.style.setProperty('--color-accent', settings.accentColor);
    
    // Also update hover/glow colors based on primary (simplified for now)
    root.style.setProperty('--color-primary-hover', settings.primaryColor + 'ee');
    root.style.setProperty('--color-primary-glow', settings.primaryColor + '66');
  };

  const fetchTheme = async () => {
    try {
      const settings = await themeRepository.getCurrentTheme();
      if (settings && settings.primaryColor) {
        setTheme(settings);
        applyTheme(settings);
      }
    } catch (error) {
      console.error('Failed to fetch theme:', error);
      // Fallback to defaults already in state
      applyTheme(theme);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (newTheme: ThemeSettings) => {
    await themeRepository.updateTheme(newTheme);
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
