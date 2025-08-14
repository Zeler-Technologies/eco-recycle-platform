import React, { createContext, useContext, useState } from 'react';

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
  session: any;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Simple mock authentication that won't crash Lovable
  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test accounts - simple and safe
      if (email === 'admin@pantabilen.se' && password === 'admin123') {
        setUser({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@pantabilen.se',
          name: 'Super Admin',
          role: 'super_admin',
          tenant_country: 'Sverige'
        });
      } else if (email === 'admin@stockholm.pantabilen.se' && password === 'stockholm123') {
        setUser({
          id: 'tenant-admin-001',
          email: 'admin@stockholm.pantabilen.se',
          name: 'Stockholm Admin',
          role: 'tenant_admin',
          tenant_id: 1,
          tenant_name: 'PantaBilen Stockholm',
          tenant_country: 'Sverige'
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
  };

  // Simple permission check
  const hasPermission = (action: string, resource: string): boolean => {
    if (!user) return false;
    
    switch (user.role) {
      case 'super_admin':
        return true;
      case 'tenant_admin':
        return resource.includes('tenant') || resource.includes('driver') || resource.includes('customer');
      default:
        return false;
    }
  };

  const theme = user?.role === 'super_admin' ? 'admin' : 'default';

  return (
    <AuthContext.Provider value={{ 
      user, 
      session: null,
      login, 
      logout, 
      loading, 
      isAnonymous: false,
      isAuthenticated: !!user,
      theme,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};