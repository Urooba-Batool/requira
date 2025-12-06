import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { DashboardType, ClientMeta } from '@/types/requira';

interface AuthContextType {
  currentDashboard: DashboardType;
  clientMeta: ClientMeta | null;
  userId: string | null;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (dashboardType: DashboardType, meta?: ClientMeta) => void;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string, company: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  checkAdminRole: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentDashboard, setCurrentDashboard] = useState<DashboardType>(null);
  const [clientMeta, setClientMeta] = useState<ClientMeta | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          setCurrentDashboard(null);
          setClientMeta(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    const hasAdmin = !!data && !error;
    setIsAdmin(hasAdmin);
    return hasAdmin;
  }, [user]);

  const fetchClientMeta = useCallback(async (userId: string): Promise<ClientMeta | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, company, email')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data && !error) {
      return {
        name: data.name,
        company: data.company || '',
        email: data.email,
      };
    }
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, company: string): Promise<{ error: string | null }> => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          company,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'This email is already registered. Please sign in instead.' };
      }
      return { error: error.message };
    }

    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login')) {
        return { error: 'Invalid email or password.' };
      }
      return { error: error.message };
    }

    return { error: null };
  }, []);

  const login = useCallback(async (dashboardType: DashboardType, meta?: ClientMeta) => {
    setCurrentDashboard(dashboardType);
    
    if (dashboardType === 'admin') {
      setIsAdmin(true);
    } else if (meta) {
      setClientMeta(meta);
    } else if (user) {
      // Fetch meta from database
      const dbMeta = await fetchClientMeta(user.id);
      if (dbMeta) {
        setClientMeta(dbMeta);
      }
    }
  }, [user, fetchClientMeta]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentDashboard(null);
    setClientMeta(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      currentDashboard, 
      clientMeta, 
      userId: user?.id ?? null,
      user,
      session,
      isLoading,
      isAdmin,
      login, 
      logout,
      signUp,
      signIn,
      checkAdminRole,
    }}>
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
