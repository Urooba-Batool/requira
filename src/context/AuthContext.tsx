import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DashboardType, ClientMeta } from '@/types/requira';

interface AuthContextType {
  currentDashboard: DashboardType;
  clientMeta: ClientMeta | null;
  userId: string;
  login: (dashboardType: DashboardType, meta?: ClientMeta) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentDashboard, setCurrentDashboard] = useState<DashboardType>(null);
  const [clientMeta, setClientMeta] = useState<ClientMeta | null>(null);
  const [userId] = useState(() => crypto.randomUUID());

  const login = useCallback((dashboardType: DashboardType, meta?: ClientMeta) => {
    setCurrentDashboard(dashboardType);
    if (meta) {
      setClientMeta(meta);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentDashboard(null);
    setClientMeta(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentDashboard, clientMeta, userId, login, logout }}>
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
