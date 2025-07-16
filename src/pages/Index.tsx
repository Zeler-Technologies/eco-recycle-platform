import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import SuperAdminDashboard from '@/components/SuperAdmin/SuperAdminDashboard';
import TenantDashboard from '@/components/Tenant/TenantDashboard';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based dashboard rendering
  switch (user.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'tenant_admin':
      return <TenantDashboard />;
    case 'driver':
      // TODO: Implement driver mobile interface
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Driver Interface</h1>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </div>
      );
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Index;
