import { AuthHandler } from '@/components/auth/AuthHandler';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const RequiraApp = () => {
  const { currentDashboard, clientMeta, login, logout, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentDashboard || !user) {
    return <AuthHandler onLogin={login} />;
  }

  if (currentDashboard === 'admin') {
    return <AdminDashboard onLogout={logout} />;
  }

  if (currentDashboard === 'client' && clientMeta) {
    return <ClientDashboard clientMeta={clientMeta} onLogout={logout} />;
  }

  return <AuthHandler onLogin={login} />;
};

const Index = () => {
  return (
    <AuthProvider>
      <RequiraApp />
    </AuthProvider>
  );
};

export default Index;
