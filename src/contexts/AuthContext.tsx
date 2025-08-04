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

  // Real Supabase authentication check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        // Get user data from auth_users table
        const { data: authUser } = await supabase
          .from('auth_users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (authUser) {
          const userData: User = {
            id: authUser.id,
            email: authUser.email,
            name: authUser.email.split('@')[0], // Use email prefix as name
            role: authUser.role as UserRole,
            tenant_id: authUser.tenant_id?.toString(),
            is_active: true,
            language: 'en'
          };
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Handle existing session same way as above
        supabase
          .from('auth_users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: authUser }) => {
            if (authUser) {
              const userData: User = {
                id: authUser.id,
                email: authUser.email,
                name: authUser.email.split('@')[0],
                role: authUser.role as UserRole,
                tenant_id: authUser.tenant_id?.toString(),
                is_active: true,
                language: 'en'
              };
              setUser(userData);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Real Supabase authentication
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error && error.message.includes('Invalid login credentials')) {
        // Create user if doesn't exist  
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (signUpError) throw signUpError;

        // After signup, try to sign in again
        const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (retryError) throw retryError;
      } else if (error) {
        throw error;
      }

      // Get the authenticated user
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (supabaseUser) {
        // Create/update record in auth_users table
        await supabase
          .from('auth_users')
          .upsert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            role: 'super_admin', // Default role
            tenant_id: null // null = access all tenants
          });

        console.log('Real authentication setup complete!');
      }

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