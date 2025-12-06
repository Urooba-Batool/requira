import { useState } from 'react';
import { RoleSelector } from './RoleSelector';
import { AdminLogin } from './AdminLogin';
import { ClientAuth } from './ClientAuth';
import { ClientMeta, DashboardType } from '@/types/requira';

interface AuthHandlerProps {
  onLogin: (type: DashboardType, meta?: ClientMeta) => void;
}

type AuthStep = 'select' | 'admin' | 'client';

export const AuthHandler = ({ onLogin }: AuthHandlerProps) => {
  const [step, setStep] = useState<AuthStep>('select');

  if (step === 'admin') {
    return (
      <AdminLogin
        onSuccess={() => onLogin('admin')}
        onBack={() => setStep('select')}
      />
    );
  }

  if (step === 'client') {
    return (
      <ClientAuth
        onSuccess={(meta) => onLogin('client', meta)}
        onBack={() => setStep('select')}
      />
    );
  }

  return (
    <RoleSelector
      onSelectAdmin={() => setStep('admin')}
      onSelectClient={() => setStep('client')}
    />
  );
};
