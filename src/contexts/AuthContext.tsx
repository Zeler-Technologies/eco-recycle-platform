import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

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
  error: string | null;
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
  devCreateUser: (email: string, password: string, role: UserRole, tenantId?: number) => Promise<boolean>;
  refetchProfile: () => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError(sessionError.message);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', event, session?.user?.email);
          
          // Handle explicit sign out
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setProfile(null);
            setError(null);
            return;
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setProfile(null);
          }
        }
      );

      setLoading(false);
      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user ID:', userId);
      
      const { data, error } = await supabase
        .from('auth_users')
        .select(`
          *,
          tenants:tenant_id (
            name
          )
        `)
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error);
        
        if (error.code === 'PGRST116') {
          console.log('No profile found, this is expected for new users');
          setProfile(null);
        } else {
          setError(`Failed to fetch profile: ${error.message}`);
        }
        return;
      }
      
      if (data) {
        console.log('Profile fetched successfully:', data);
        const typedProfile: AuthUser = {
          ...data,
          role: data.role as UserRole
        };
        setProfile(typedProfile);
        setError(null);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      setError(error.message);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setError(error.message);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
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
    try {
      setLoading(true);
      
      // First clear all state immediately
      setUser(null);
      setProfile(null);
      setSession(null);
      setError(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        setError(error.message);
      }
      
      // Don't force reload, let React Router handle navigation
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // DEVELOPMENT ONLY: Create real users for testing
  const devCreateUser = async (email: string, password: string, role: UserRole, tenantId?: number): Promise<boolean> => {
    try {
      console.log('Creating dev user:', { email, role, tenantId });
      
      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        toast.error(`Failed to create auth user: ${authError.message}`);
        return false;
      }

      if (!authData.user) {
        toast.error('No user data returned from signup');
        return false;
      }

      console.log('Auth user created:', authData.user.id);

      // Step 2: Create profile record (wait a moment for auth user to be fully created)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error: profileError } = await supabase
        .from('auth_users')
        .insert({
          id: authData.user.id,
          email,
          role,
          tenant_id: tenantId || null
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast.error(`Failed to create profile: ${profileError.message}`);
        return false;
      }

      console.log('Profile created successfully');
      toast.success(`User ${email} created successfully!`);
      return true;
      
    } catch (error) {
      console.error('Unexpected error creating user:', error);
      toast.error(`Unexpected error: ${error.message}`);
      return false;
    }
  };

  const refetchProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
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
    tenant_name: (profile as any)?.tenants?.name || `Tenant ${profile.tenant_id}`,
    tenant_country: 'Sverige'
  } : null;

  const value: AuthContextType = {
    user: legacyUser, // Use legacy format for backward compatibility
    profile,
    session,
    loading,
    error,
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
    devCreateUser, // Remove this in production
    refetchProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};