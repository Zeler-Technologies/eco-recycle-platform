import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'super_admin' | 'tenant_admin' | 'scrapyard_admin' | 'scrapyard_staff' | 'driver' | 'customer' | 'user';

export interface AuthUser {
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
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
  loading: boolean;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  theme: string;
  hasPermission: (action: string, resource: string) => boolean;
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from auth_users table
  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: authUserData, error } = await supabase
        .from('auth_users')
        .select(`
          role,
          tenant_id,
          tenants (
            name,
            country
          )
        `)
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      // For drivers, also get their driver record
      let driverData = null;
      if (authUserData.role === 'driver') {
        const { data: driver } = await supabase
          .from('drivers')
          .select('full_name, tenant_id, scrapyard_id')
          .eq('auth_user_id', authUser.id)
          .single();
        driverData = driver;
      }

      return {
        id: authUser.id,
        email: authUser.email || '',
        name: driverData?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role: authUserData.role,
        tenant_id: authUserData.tenant_id,
        scrapyard_id: driverData?.scrapyard_id,
        tenant_name: authUserData.tenants?.name,
        tenant_country: authUserData.tenants?.country || 'Sverige'
      };
    } catch (err) {
      console.error('Error in loadUserProfile:', err);
      return null;
    }
  };

  // Real Supabase authentication
  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // The session will be handled by the auth state change listener
      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
  };

  // Simple permission check
  const hasPermission = (action: string, resource: string): boolean => {
    if (!user) return false;
    
    switch (user.role) {
      case 'super_admin':
        return true;
      case 'tenant_admin':
        return resource.includes('tenant') || resource.includes('driver') || resource.includes('customer');
      case 'driver':
        return resource.includes('driver') && action.includes('read');
      default:
        return false;
    }
  };

  const theme = user?.role === 'super_admin' ? 'admin' : 'default';

  // Set up auth state listener
  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        
        if (session?.user) {
          // Load user profile when session is available
          setTimeout(async () => {
            const profile = await loadUserProfile(session.user);
            if (mounted) {
              setUser(profile);
              setLoading(false);
            }
          }, 0);
        } else {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user).then(profile => {
          if (mounted) {
            setUser(profile);
            setLoading(false);
          }
        });
      } else {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseAuthContext.Provider value={{ 
      user, 
      session,
      login, 
      logout, 
      loading, 
      isAnonymous: false,
      isAuthenticated: !!session?.user,
      theme,
      hasPermission
    }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};