import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, User, Truck, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const { signIn, devCreateUser, user, profile, error: authError, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [detailedDebug, setDetailedDebug] = useState('');

  const comprehensiveDebugTest = async () => {
    setDetailedDebug('Starting comprehensive debug test...\n');
    
    try {
      // Test 1: Check current auth status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      setDetailedDebug(prev => prev + `Current session: ${session ? session.user.email : 'None'}\n`);
      if (sessionError) {
        setDetailedDebug(prev => prev + `Session error: ${sessionError.message}\n`);
      }
      
      // Test 2: Try to create ONE user step by step
      const testEmail = 'test@debug.com';
      const testPassword = 'debug123456';
      
      setDetailedDebug(prev => prev + `\nAttempting to create user: ${testEmail}\n`);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: undefined
        }
      });
      
      setDetailedDebug(prev => prev + `SignUp result:\n`);
      setDetailedDebug(prev => prev + `- User created: ${signUpData.user ? 'YES' : 'NO'}\n`);
      setDetailedDebug(prev => prev + `- User ID: ${signUpData.user?.id || 'None'}\n`);
      setDetailedDebug(prev => prev + `- User email: ${signUpData.user?.email || 'None'}\n`);
      setDetailedDebug(prev => prev + `- Email confirmed: ${signUpData.user?.email_confirmed_at ? 'YES' : 'NO'}\n`);
      setDetailedDebug(prev => prev + `- Error: ${signUpError ? signUpError.message : 'None'}\n`);
      
      if (signUpError) {
        setDetailedDebug(prev => prev + `SignUp failed: ${signUpError.message}\n`);
        return;
      }
      
      // Test 3: Try to sign in immediately
      setDetailedDebug(prev => prev + `\nAttempting to sign in with: ${testEmail}\n`);
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      setDetailedDebug(prev => prev + `SignIn result:\n`);
      setDetailedDebug(prev => prev + `- Success: ${signInData.user ? 'YES' : 'NO'}\n`);
      setDetailedDebug(prev => prev + `- Error: ${signInError ? signInError.message : 'None'}\n`);
      
      // Test 4: Try to create profile
      if (signInData.user) {
        setDetailedDebug(prev => prev + `\nAttempting to create profile...\n`);
        
        const { data: profileData, error: profileError } = await supabase
          .from('auth_users')
          .insert({
            id: signInData.user.id,
            email: testEmail,
            role: 'super_admin',
            tenant_id: null
          })
          .select();
        
        setDetailedDebug(prev => prev + `Profile creation:\n`);
        setDetailedDebug(prev => prev + `- Success: ${profileData ? 'YES' : 'NO'}\n`);
        setDetailedDebug(prev => prev + `- Error: ${profileError ? profileError.message : 'None'}\n`);
        
        // Sign out after test
        await supabase.auth.signOut();
      }
      
      setDetailedDebug(prev => prev + `\n✅ Debug test complete!\n`);
      
    } catch (error) {
      setDetailedDebug(prev => prev + `\n❌ Unexpected error: ${error.message}\n`);
    }
  };

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
      { email: 'admin@pantabilen.se', password: 'SecurePass123!', role: 'super_admin', tenantId: null },
      { email: 'admin@demoscrapyard.se', password: 'SecurePass123!', role: 'tenant_admin', tenantId: 1 },
      { email: 'test@customer.se', password: 'SecurePass123!', role: 'customer', tenantId: 1 },
      { email: 'erik@pantabilen.se', password: 'SecurePass123!', role: 'driver', tenantId: 1 }
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

  const correctedDemoAccounts = {
    super_admin: {
      email: 'admin@pantabilen.se',
      password: 'SecurePass123!',
      role: 'super_admin',
      name: 'Super Admin',
      description: 'Full system access',
      icon: <Shield className="h-4 w-4" />,
      color: 'bg-red-100 text-red-700'
    },
    tenant_admin: {
      email: 'admin@demoscrapyard.se',
      password: 'SecurePass123!',
      role: 'tenant_admin', 
      name: 'Tenant Admin',
      description: 'Manage scrapyard operations',
      icon: <Users className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-700'
    },
    driver: {
      email: 'erik@pantabilen.se',
      password: 'SecurePass123!',
      role: 'driver',
      name: 'Erik (Driver)',
      description: 'Handle car pickups',
      icon: <Truck className="h-4 w-4" />,
      color: 'bg-green-100 text-green-700'
    },
    customer: {
      email: 'test@customer.se', 
      password: 'SecurePass123!',
      role: 'customer',
      name: 'Demo Customer',
      description: 'Request car pickup',
      icon: <User className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-700'
    },
    debug: {
      email: 'test@debug.com',
      password: 'debug123456',
      role: 'super_admin',
      name: 'Debug User',
      description: 'Debug test user',
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-700'
    }
  };

  const handleDemoLogin = async (account) => {
    try {
      console.log(`🚀 Demo login: ${account.email} / ${account.password}`);
      await quickLogin(account.email, account.password);
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

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
                onClick={comprehensiveDebugTest} 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                🔍 Comprehensive Debug Test
              </Button>

              <Button 
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const { data, error } = await supabase.functions.invoke('debug-login', {
                      body: { email: 'admin@pantabilen.se', password: 'SecurePass123!' }
                    });
                    if (error) {
                      toast.error(`Debug error: ${error.message}`);
                      setDebugInfo(`Debug error: ${error.message}`);
                    } else {
                      toast.success('Debug complete - check logs');
                      setDebugInfo(`Debug result: ${JSON.stringify(data, null, 2)}`);
                    }
                  } catch (err) {
                    toast.error('Debug failed');
                    setDebugInfo(`Debug failed: ${err.message}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                🐛 Debug Login Process
              </Button>

              <Button 
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const { data, error } = await supabase.functions.invoke('fix-auth-users');
                    if (error) {
                      toast.error(`Error: ${error.message}`);
                      setDebugInfo(`Fix auth users error: ${error.message}`);
                    } else {
                      toast.success('Auth users fixed successfully!');
                      setDebugInfo(`Auth users fixed: ${JSON.stringify(data.results)}`);
                    }
                  } catch (err) {
                    toast.error('Failed to fix auth users');
                    setDebugInfo(`Fix error: ${err.message}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                🔧 Fix Auth Users & Passwords
              </Button>

              <Button 
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const { data, error } = await supabase.functions.invoke('reset-all-passwords', {
                      body: { new_password: 'SecurePass123!' }
                    });
                    if (error) {
                      toast.error(`Reset error: ${error.message}`);
                      setDebugInfo(`Reset error: ${error.message}`);
                    } else {
                      toast.success('All user passwords set to SecurePass123!');
                      setDebugInfo(`Reset result: ${JSON.stringify(data, null, 2)}`);
                    }
                  } catch (err) {
                    toast.error('Password reset failed');
                    setDebugInfo(`Reset failed: ${err.message}`);
                  } finally {
                    setIsLoading(false);
                  }
                }} 
                className="w-full bg-black/80 hover:bg-black"
                disabled={isLoading}
              >
                🔐 Reset All Passwords (Dev)
              </Button>

              <Button 
                onClick={createAllDevUsers} 
                className="w-full bg-orange-600 hover:bg-orange-700"
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

            {/* Detailed Debug Output */}
            {detailedDebug && (
              <div className="bg-gray-900 text-green-400 p-4 rounded text-xs font-mono max-h-60 overflow-auto">
                <pre>{detailedDebug}</pre>
              </div>
            )}
            
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
            <div className="text-sm font-medium text-gray-700 mb-3">
              🚀 Quick Demo Login:
            </div>
            
            {/* Demo Accounts */}
            {Object.entries(correctedDemoAccounts).map(([key, account]) => (
              <div key={key} className="space-y-2">
                <button
                  onClick={() => handleDemoLogin(account)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  disabled={isLoading}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${account.color}`}>
                        {account.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">{account.description}</div>
                        <div className="text-xs text-blue-600 mt-1">
                          📧 {account.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mb-1">
                        {account.role}
                      </div>
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                        🔑 {account.password}
                      </div>
                    </div>
                  </div>
                </button>
                
                <Button
                  onClick={() => fillCredentials(account.email, account.password)}
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  Fill Credentials Only
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