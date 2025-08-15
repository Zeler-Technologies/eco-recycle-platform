import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, User, Truck, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { signIn, devCreateUser, user, profile, error: authError, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        toast.error(error.message);
        setDebugInfo(`Login error: ${error.message}`);
      } else {
        toast.success('Logged in successfully!');
        setDebugInfo('Login successful, waiting for profile...');
        
        // Wait a moment then check profile
        setTimeout(() => {
          refetchProfile();
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
      setDebugInfo(`Unexpected error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // DEVELOPMENT ONLY: Create development users for testing
  const createAllDevUsers = async () => {
    setIsLoading(true);
    setDebugInfo('Creating development users...');
    
    const users = [
      { email: 'admin@pantabilen.se', password: 'admin123', role: 'super_admin', tenantId: null },
      { email: 'tenant@demo.se', password: 'tenant123', role: 'tenant_admin', tenantId: 1 },
      { email: 'driver@demo.se', password: 'driver123', role: 'driver', tenantId: 1 }
    ];
    
    for (const userData of users) {
      const success = await devCreateUser(
        userData.email, 
        userData.password, 
        userData.role as any, 
        userData.tenantId
      );
      
      if (!success) {
        setDebugInfo(`Failed to create ${userData.email}`);
        break;
      }
    }
    
    setDebugInfo('All development users created!');
    setIsLoading(false);
  };

  // Quick login helper
  const quickLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setEmail(email);
    setPassword(password);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast.error(error.message);
        setDebugInfo(`Quick login error: ${error.message}`);
      } else {
        setDebugInfo('Quick login successful!');
        setTimeout(() => {
          refetchProfile();
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      toast.error('Login failed');
      setDebugInfo(`Login failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Super Admin',
      email: 'admin@pantabilen.se',
      password: 'admin123',
      description: 'Full system access',
      icon: <Shield className="h-4 w-4" />,
      color: 'bg-red-100 text-red-700'
    },
    {
      role: 'Tenant Admin',
      email: 'tenant@demo.se', 
      password: 'tenant123',
      description: 'Manage tenant operations',
      icon: <Users className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      role: 'Driver',
      email: 'driver@demo.se',
      password: 'driver123', 
      description: 'Driver app access',
      icon: <Truck className="h-4 w-4" />,
      color: 'bg-green-100 text-green-700'
    }
  ];

  const fillCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>🚨 Emergency Login</CardTitle>
            <CardDescription>
              Emergency auth system with debugging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Debug Information */}
            <div className="p-3 bg-gray-100 rounded text-sm">
              <strong>Debug Info:</strong><br/>
              User: {user ? `${user.email} (${user.id})` : 'None'}<br/>
              Profile: {profile ? `${profile.role} (tenant: ${profile.tenant_id})` : 'None'}<br/>
              Error: {authError || 'None'}<br/>
              Status: {debugInfo || 'Ready'}
            </div>

            {/* Emergency Actions */}
            <div className="space-y-2">
              <Button 
                onClick={createAllDevUsers} 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                🚨 Create All Dev Users
              </Button>
              
              <Button 
                onClick={refetchProfile} 
                variant="outline" 
                className="w-full"
                disabled={!user}
              >
                🔄 Refetch Profile
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="E-post"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Lösenord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Loggar in...' : 'Logga in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Login Buttons */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Quick Login Options</CardTitle>
            <CardDescription>
              Emergency login buttons for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demo Accounts */}
            {demoAccounts.map((account, index) => (
              <div key={index} className="space-y-2">
                <Button
                  onClick={() => fillCredentials(account.email, account.password)}
                  variant="outline"
                  className="w-full justify-start p-4 h-auto"
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${account.color}`}>
                      {account.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{account.role}</div>
                      <div className="text-sm text-gray-500">{account.description}</div>
                      <div className="text-xs text-gray-400">{account.email}</div>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => quickLogin(account.email, account.password)}
                  size="sm"
                  className="w-full"
                  disabled={isLoading}
                >
                  Quick Login as {account.role}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;