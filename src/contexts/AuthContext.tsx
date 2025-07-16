import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'super_admin' | 'tenant_admin' | 'driver';

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
  theme: 'admin' | 'tenant' | 'default';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock user data for development
const mockUsers: User[] = [
  {
    id: '1',
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
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mock authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Mock authentication
      const mockUser = mockUsers.find(u => u.email === email);
      
      if (!mockUser) {
        throw new Error('Invalid credentials');
      }

      // Mock password validation
      const validPasswords: { [key: string]: string } = {
        'admin@superadmin.com': 'admin123',
        'admin@scrapyard.se': 'scrapyard123',
        'driver@scrapyard.se': 'driver123'
      };

      if (validPasswords[email] !== password) {
        throw new Error('Invalid credentials');
      }

      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${mockUser.name}!`,
      });

    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : 'Authentication failed',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const theme = user?.role === 'super_admin' ? 'admin' : 
               user?.role === 'tenant_admin' ? 'tenant' : 'default';

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    theme
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};