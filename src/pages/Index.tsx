import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import PantaBilenDriverApp from '@/components/Driver/PantaBilenDriverAppNew';
import SuperAdminDashboard from '@/components/SuperAdmin/SuperAdminDashboard';
import TenantDashboard from '@/components/Tenant/TenantDashboard';
import CustomerApp from '@/pages/CustomerApp';
import Login from '@/pages/Login';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';

const Index = () => {
  const { user, profile, loading, isAuthenticated } = useAuth();

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  switch (profile.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    
    case 'tenant_admin':
      return <TenantDashboard />;
    
    case 'driver':
      return <PantaBilenDriverApp />;
    
    case 'customer':
      return <CustomerApp />;
    
    default:
      // Unknown role, redirect to login
      return <Navigate to="/login" replace />;
  }
};

export default Index;