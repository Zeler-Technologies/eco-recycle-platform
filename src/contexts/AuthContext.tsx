
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
// import { useToast } from '@/hooks/use-toast';

export type UserRole = 'super_admin' | 'tenant_admin' | 'driver' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenant_id?: string;
  tenant_name?: string;
  permissions?: string[];
  is_active: boolean;
  language?: string;
}

// Local type for whoami RPC
type WhoAmIRow = {
  user_id: string;
  role: 'super_admin' | 'tenant_admin' | 'driver' | 'customer' | 'user' | string;
  tenant_id: number | null;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  theme: 'admin' | 'tenant' | 'customer' | 'default';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock user data for development
const mockUsers: User[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@superadmin.com',
    name: 'Super Admin',
    role: 'super_admin',
    permissions: ['full_access'],
    is_active: true,
    language: 'en'
  },
  {
    id: '2',
    email: 'admin@scrapyard.se',
    name: 'Scrap Yard Admin',
    role: 'tenant_admin',
    tenant_id: 'tenant_1',
    tenant_name: 'Panta Bilen Stockholm',
    permissions: ['manage_orders', 'manage_drivers', 'view_analytics'],
    is_active: true,
    language: 'sv'
  },
  {
    id: '3',
    email: 'driver@scrapyard.se',
    name: 'Erik Andersson',
    role: 'driver',
    tenant_id: 'tenant_1',
    tenant_name: 'Panta Bilen Stockholm',
    permissions: ['view_assigned_orders', 'update_order_status'],
    is_active: true,
    language: 'sv'
  },
  {
    id: '4',
    email: 'customer@demo.se',
    name: 'Anna Larsson',
    role: 'customer',
    permissions: ['request_pickup', 'view_quotes', 'track_orders'],
    is_active: true,
    language: 'sv'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // const { toast } = useToast();

  console.log('AuthProvider rendered, user:', user, 'loading:', loading);

  const logWhoAmI = async (context: string) => {
    try {
      const { data: who, error: whoErr } = await supabase
        .rpc('whoami' as any)
        .returns<WhoAmIRow[]>();
      const me = who?.[0] ?? null;
      if (whoErr) {
        console.warn(`[whoami][${context}] error:`, whoErr.message);
      } else {
        console.info(`[whoami][${context}]`, me);
      }
    } catch (e) {
      console.warn(`[whoami][${context}] failed`, e);
    }
  };

  // Real Supabase authentication check - SIMPLIFIED to bypass auth_users table issues
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        // Create user data directly from Supabase session without querying auth_users table
        let userRole: UserRole = 'super_admin';
        let tenantId: string | undefined = undefined;
        
        // Map demo emails to roles
        if (session.user.email === 'admin@scrapyard.se') {
          userRole = 'tenant_admin';
          tenantId = '1';
        } else if (session.user.email === 'driver@scrapyard.se' || session.user.email === 'mikaela@scrapyard.se') {
          userRole = 'driver';
          tenantId = '1';
        } else if (session.user.email === 'customer@demo.se') {
          userRole = 'customer';
        }

        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email?.split('@')[0] || 'User',
          role: userRole,
          tenant_id: tenantId,
          is_active: true,
          language: 'en'
        };
        
        console.log('Setting user:', userData);
        setUser(userData);

        // Log whoami for debugging RLS context
        logWhoAmI('onAuthStateChange');
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Handle existing session same way as above
        let userRole: UserRole = 'super_admin';
        let tenantId: string | undefined = undefined;
        
        if (session.user.email === 'admin@scrapyard.se') {
          userRole = 'tenant_admin';
          tenantId = '1';
        } else if (session.user.email === 'driver@scrapyard.se' || session.user.email === 'mikaela@scrapyard.se') {
          userRole = 'driver';
          tenantId = '1';
        } else if (session.user.email === 'customer@demo.se') {
          userRole = 'customer';
        }

        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email?.split('@')[0] || 'User',
          role: userRole,
          tenant_id: tenantId,
          is_active: true,
          language: 'en'
        };
        
        console.log('Setting user from existing session:', userData);
        setUser(userData);

        // Log whoami for debugging RLS context
        logWhoAmI('getSession');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Super admin demo bypass (no Supabase call)
      if (email === 'admin@superadmin.com' && password === 'admin123') {
        const superAdminUser: User = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@superadmin.com',
          name: 'Super Admin',
          role: 'super_admin',
          is_active: true,
          language: 'en'
        };
        setUser(superAdminUser);
        console.log('Super admin login successful');
        return;
      }

      // For all other accounts, only attempt sign-in.
      // IMPORTANT: Do NOT auto sign-up to avoid token churn and unexpected emails.
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message || 'Invalid credentials');
      }

      // onAuthStateChange will populate the user state on success
      console.log('Authentication successful for:', email);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    console.log('Logged out successfully');
  };

  const theme = user?.role === 'super_admin' ? 'admin' : 
               user?.role === 'tenant_admin' ? 'tenant' : 
               user?.role === 'customer' ? 'customer' : 'default';

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    theme
  };

  console.log('AuthProvider providing value:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
