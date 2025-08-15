import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'super_admin' | 'tenant_admin' | 'scrapyard_admin' | 'scrapyard_staff' | 'driver' | 'customer';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  tenant_id?: number;
  scrapyard_id?: number;
  tenant_name?: string;
  tenant_country?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string; // Use string to match database type
  tenant_id?: number;
  created_at?: string;
  updated_at?: string;
  pnr_num?: string;
  pnr_num_norm?: string;
}

interface AuthContextType {
  user: User | null; // Keep backward compatibility for components
  profile: AuthUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ data?: any; error?: any }>; // Keep backward compatibility
  logout: () => Promise<void>; // Keep backward compatibility
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAnonymous: boolean; // Keep backward compatibility
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isDriver: boolean;
  isCustomer: boolean;
  tenantId: number | null;
  theme: string;
  hasPermission: (action: string, resource: string) => boolean;
  // Development only - remove in production
  devCreateUser: (email: string, password: string, role: UserRole, tenantId?: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential recursion in auth state changes
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        // Type cast the database role to our UserRole
        const typedProfile: AuthUser = {
          ...data,
          role: data.role as UserRole
        };
        setProfile(typedProfile);
      } else if (error) {
        console.error('Error fetching user profile:', error);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: userData
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // DEVELOPMENT ONLY: Create real users for testing
  const devCreateUser = async (email: string, password: string, role: UserRole, tenantId?: number) => {
    try {
      // First create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return;
      }

      if (authData.user) {
        // Then create profile record
        const { error: profileError } = await supabase
          .from('auth_users')
          .insert({
            id: authData.user.id,
            email,
            role: role as any, // Cast to match database enum
            tenant_id: tenantId || null
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        } else {
          console.log(`Created user: ${email} with role: ${role}`);
        }
      }
    } catch (error) {
      console.error('Error in devCreateUser:', error);
    }
  };

  // Permission check
  const hasPermission = (action: string, resource: string): boolean => {
    if (!profile) return false;
    
    switch (profile.role as UserRole) {
      case 'super_admin':
        return true;
      case 'tenant_admin':
        return resource.includes('tenant') || resource.includes('driver') || resource.includes('customer');
      case 'scrapyard_admin':
        return resource.includes('scrapyard') || resource.includes('car') || resource.includes('customer');
      case 'driver':
        return resource.includes('pickup') || resource.includes('assignment');
      default:
        return false;
    }
  };

  const theme = profile?.role === 'super_admin' ? 'admin' : 'default';

  // Create backward compatible user object
  const legacyUser: User | null = profile ? {
    id: profile.id,
    email: profile.email,
    name: profile.email.split('@')[0], // Extract name from email
    role: profile.role as UserRole,
    tenant_id: profile.tenant_id,
    scrapyard_id: undefined,
    tenant_name: `Tenant ${profile.tenant_id}`,
    tenant_country: 'Sverige'
  } : null;

  const value: AuthContextType = {
    user: legacyUser, // Use legacy format for backward compatibility
    profile,
    session,
    loading,
    login: signIn, // Alias for backward compatibility
    logout: signOut, // Alias for backward compatibility
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    isAnonymous: false, // Keep backward compatibility
    isSuperAdmin: profile?.role === 'super_admin',
    isTenantAdmin: profile?.role === 'tenant_admin',
    isDriver: profile?.role === 'driver',
    isCustomer: profile?.role === 'customer',
    tenantId: profile?.tenant_id || null,
    theme,
    hasPermission,
    devCreateUser // Remove this in production
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};