import { useState } from 'react';
import { AuthHandler } from '@/components/auth/AuthHandler';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { ClientMeta, DashboardType } from '@/types/requira';

const RequiraApp = () => {
  const [currentDashboard, setCurrentDashboard] = useState<DashboardType>(null);
  const [clientMeta, setClientMeta] = useState<ClientMeta | null>(null);

  const handleLogin = (type: DashboardType, meta?: ClientMeta) => {
    setCurrentDashboard(type);
    if (meta) {
      setClientMeta(meta);
    }
  };

  const handleLogout = () => {
    setCurrentDashboard(null);
    setClientMeta(null);
  };

  if (!currentDashboard) {
    return <AuthHandler onLogin={handleLogin} />;
  }

  if (currentDashboard === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (currentDashboard === 'client' && clientMeta) {
    return <ClientDashboard clientMeta={clientMeta} onLogout={handleLogout} />;
  }

  return null;
};

const Index = () => {
  return (
    <AuthProvider>
      <ProjectProvider>
        <RequiraApp />
      </ProjectProvider>
    </AuthProvider>
  );
};

export default Index;
