import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import SuperAdminDashboard from '@/components/SuperAdmin/SuperAdminDashboard';
import TenantDashboard from '@/components/Tenant/TenantDashboard';
import PantaBilenDriverApp from '@/components/Driver/PantaBilenDriverApp';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Debug logging
  console.log('Index component - User:', user);
  console.log('Index component - Loading:', loading);

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bilskrot Management System
          </h1>
          <p className="text-xl text-gray-800 mb-8">
            Välj hur du vill logga in
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/bankid')}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 rounded-2xl text-lg font-semibold"
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="text-xl font-bold">iD</div>
                <span>Logga in med BankID</span>
              </div>
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white py-4 rounded-2xl font-medium"
            >
              Traditionell inloggning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Role-based dashboard rendering
  switch (user.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'tenant_admin':
      return <TenantDashboard />;
    case 'driver':
      return <Navigate to="/driver-app" replace />;
    case 'customer':
      return <Navigate to="/customer-app" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Index;
