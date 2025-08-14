import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { DatabaseUserProfile } from '@/types/database';

export type UserRole = 'super_admin' | 'tenant_admin' | 'scrapyard_admin' | 'scrapyard_staff' | 'driver' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenant_id?: number;
  scrapyard_id?: number;
  tenant_name?: string;
  tenant_country?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  theme: string;
  hasPermission: (action: string, resource: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // Handle both authenticated and anonymous sessions
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          setSession(currentSession);
          await fetchUserProfile(currentSession.user.id);
        } else {
          // Check if we're on customer-facing routes that allow anonymous access
          const isCustomerRoute = window.location.pathname.startsWith('/customer') || 
                                window.location.pathname === '/';
          setIsAnonymous(isCustomerRoute);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        try {
          setSession(newSession);
          
          if (newSession?.user) {
            await fetchUserProfile(newSession.user.id);
            setIsAnonymous(false);
          } else {
            setUser(null);
            const isCustomerRoute = window.location.pathname.startsWith('/customer') || 
                                  window.location.pathname === '/';
            setIsAnonymous(isCustomerRoute);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // For now, use mock data since user_profiles table may not be fully set up
  const fetchUserProfile = async (userId: string) => {
    try {
      // Get user from auth
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      console.log('fetchUserProfile called for userId:', userId);
      console.log('authUser from supabase:', authUser.user);

      // For now, determine role based on email patterns since user_profiles may not exist yet
      let role: UserRole = 'customer';
      let tenantId: number | undefined = undefined;
      let tenantName: string | undefined = undefined;

      if (authUser.user.email?.includes('admin@pantabilen.se')) {
        role = 'super_admin';
        tenantId = undefined; // Super admin has no specific tenant
        tenantName = undefined;
      } else if (authUser.user.email?.includes('@stockholm.pantabilen.se')) {
        role = 'tenant_admin';
        tenantId = 1;
        tenantName = 'PantaBilen Stockholm';
      } else if (authUser.user.email?.includes('@goteborg.pantabilen.se')) {
        role = 'tenant_admin';
        tenantId = 2;
        tenantName = 'PantaBilen Göteborg';
      } else if (authUser.user.email?.includes('@skrot.stockholm.se')) {
        role = 'scrapyard_admin';
        tenantId = 1;
        tenantName = 'PantaBilen Stockholm';
      } else if (authUser.user.email?.includes('erik@pantabilen.se') || authUser.user.email?.includes('anna@pantabilen.se')) {
        role = 'driver';
        tenantId = 1;
        tenantName = 'PantaBilen Stockholm';
      }

      const userData = {
        id: userId,
        email: authUser.user.email || '',
        name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'User',
        role,
        tenant_id: tenantId,
        tenant_name: tenantName,
        tenant_country: 'Sverige'
      };

      console.log('Setting user data:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set fallback user data
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        setUser({
          id: userId,
          email: authUser.user.email || '',
          name: authUser.user.email?.split('@')[0] || 'User',
          role: 'customer'
        });
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Test accounts for different admin roles
      const testAccounts = {
        // Super Admin
        'admin@pantabilen.se': {
          password: 'admin123',
          user: {
            id: '00000000-0000-0000-0000-000000000001', // Match database UUID
            email: 'admin@pantabilen.se',
            name: 'Super Admin',
            role: 'super_admin' as UserRole,
            tenant_id: undefined,
            tenant_name: undefined,
            tenant_country: 'Sverige'
          }
        },
        // Tenant Admin
        'admin@stockholm.pantabilen.se': {
          password: 'stockholm123',
          user: {
            id: 'tenant-admin-001',
            email: 'admin@stockholm.pantabilen.se',
            name: 'Stockholm Admin',
            role: 'tenant_admin' as UserRole,
            tenant_id: 1,
            tenant_name: 'PantaBilen Stockholm',
            tenant_country: 'Sverige'
          }
        },
        // Another Tenant Admin
        'admin@goteborg.pantabilen.se': {
          password: 'goteborg123', 
          user: {
            id: 'tenant-admin-002',
            email: 'admin@goteborg.pantabilen.se',
            name: 'Göteborg Admin',
            role: 'tenant_admin' as UserRole,
            tenant_id: 2,
            tenant_name: 'PantaBilen Göteborg',
            tenant_country: 'Sverige'
          }
        },
        // Scrapyard Admin
        'admin@skrot.stockholm.se': {
          password: 'skrot123',
          user: {
            id: 'scrapyard-admin-001',
            email: 'admin@skrot.stockholm.se',
            name: 'Skrotgård Admin Stockholm',
            role: 'scrapyard_admin' as UserRole,
            tenant_id: 1,
            scrapyard_id: 1,
            tenant_name: 'PantaBilen Stockholm',
            tenant_country: 'Sverige'
          }
        },
        // Driver
        'erik@pantabilen.se': {
          password: 'driver123',
          user: {
            id: 'driver-001',
            email: 'erik@pantabilen.se',
            name: 'Erik Andersson',
            role: 'driver' as UserRole,
            tenant_id: 1,
            scrapyard_id: 1,
            tenant_name: 'PantaBilen Stockholm',
            tenant_country: 'Sverige'
          }
        },
        // Another Driver
        'anna@pantabilen.se': {
          password: 'driver123',
          user: {
            id: 'driver-002',
            email: 'anna@pantabilen.se',
            name: 'Anna Larsson',
            role: 'driver' as UserRole,
            tenant_id: 1,
            scrapyard_id: 1,
            tenant_name: 'PantaBilen Stockholm',
            tenant_country: 'Sverige'
          }
        }
      };

      // Check for test account login
      const testAccount = testAccounts[email as keyof typeof testAccounts];
      if (testAccount && password === testAccount.password) {
        setUser(testAccount.user);
        setIsAnonymous(false);
        return;
      }

      // Real Supabase authentication for production accounts
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Session and user will be set by the onAuthStateChange listener
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Clear mock user data immediately for test accounts
      if (user && ['super-admin-001', '00000000-0000-0000-0000-000000000001', 'tenant-admin-001', 'tenant-admin-002', 'scrapyard-admin-001', 'driver-001', 'driver-002'].includes(user.id)) {
        setUser(null);
        setSession(null);
        setIsAnonymous(false);
        setLoading(false);
        return;
      }
      
      // For real Supabase users
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAnonymous(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear the user state
      setUser(null);
      setSession(null);
      setIsAnonymous(false);
    } finally {
      setLoading(false);
    }
  };

  // Helper for checking permissions
  const hasPermission = (action: string, resource: string): boolean => {
    if (!user && isAnonymous) {
      // Anonymous users can only submit customer requests
      return resource === 'customer_request' && action === 'create';
    }
    
    if (!user) return false;

    // Permission logic based on role
    switch (user.role) {
      case 'super_admin':
        return true; // Super admin can do everything
      case 'tenant_admin':
        return resource.includes('tenant') || resource.includes('driver') || resource.includes('customer');
      case 'driver':
        return resource === 'pickup_request' || (resource === 'driver' && action === 'update_own');
      case 'customer':
        return resource === 'customer_request';
      default:
        return false;
    }
  };

  // Theme based on user role
  const theme = user?.role === 'super_admin' ? 'admin' : 
               user?.role === 'driver' ? 'driver' : 'default';

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      login, 
      logout, 
      loading, 
      isAnonymous,
      isAuthenticated: !!user,
      theme,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};