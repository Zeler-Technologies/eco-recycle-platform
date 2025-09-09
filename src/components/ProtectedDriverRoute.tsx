import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedDriverRouteProps {
  children: React.ReactNode;
}

const ProtectedDriverRoute: React.FC<ProtectedDriverRouteProps> = ({ children }) => {
  const { user, loading, isAuthenticated, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but profile hasn't loaded yet, show a loader
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check if user has driver role
  if (profile.role !== 'driver') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need driver permissions to access this app.</p>
          <p className="text-sm text-gray-500">Current role: {profile?.role || 'unknown'}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedDriverRoute;