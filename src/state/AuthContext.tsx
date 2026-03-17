import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authRepository, User } from '../repositories/authRepository';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = authRepository.getToken();
      if (token) {
        const userData = await authRepository.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load user', error);
      authRepository.logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (credentials: any) => {
    const { token, user: userData } = await authRepository.login(credentials);
    authRepository.setToken(token);
    setUser(userData);
  };

  const logout = () => {
    authRepository.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
