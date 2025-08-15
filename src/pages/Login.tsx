import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Shield, Car, Recycle, Smartphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, devCreateUser, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log('User is already logged in, redirecting home');
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Login attempt with:', email);
      const { error: loginError } = await signIn(email, password);
      
      if (loginError) {
        setError(loginError.message || 'An error occurred during login');
      } else {
        console.log('Login successful, will redirect automatically');
        toast.success('Logged in successfully!');
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Development functions - remove in production
  const createDevUsers = async () => {
    setIsLoading(true);
    try {
      await devCreateUser('admin@pantabilen.se', 'SecurePass123!', 'super_admin');
      await devCreateUser('admin@demoscrapyard.se', 'SecurePass123!', 'tenant_admin', 1);
      await devCreateUser('erik@pantabilen.se', 'SecurePass123!', 'driver', 1);
      await devCreateUser('anna@pantabilen.se', 'SecurePass123!', 'driver', 1);
      toast.success('Development users created! You can now log in with them.');
    } catch (error) {
      console.error('Error creating dev users:', error);
      toast.error('Error creating development users');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
    } else {
      navigate('/');
    }
    setIsLoading(false);
  };

  const demoAccounts = [
    {
      role: 'Super Admin',
      email: 'admin@pantabilen.se',
      password: 'SecurePass123!',
      description: 'Full system access - Can manage all tenants and data',
      icon: Shield,
      color: 'bg-red-600'
    },
    {
      role: 'Tenant Admin - Pantabilen',
      email: 'admin@demoscrapyard.se',
      password: 'SecurePass123!',
      description: 'Manage tenant operations, drivers, and scrapyards',
      icon: Building2,
      color: 'bg-blue-600'
    },
    {
      role: 'Driver - Erik',
      email: 'erik@pantabilen.se',
      password: 'SecurePass123!',
      description: 'Driver with PNR - Can use driver app for pickups',
      icon: Car,
      color: 'bg-purple-600'
    },
    {
      role: 'Driver - Anna',
      email: 'anna@pantabilen.se',
      password: 'SecurePass123!',
      description: 'Driver with PNR - Can use driver app for pickups',
      icon: Car,
      color: 'bg-indigo-600'
    }
  ];

  const fillCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="shadow-custom-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-brand-blue" />
              <h1 className="text-2xl font-bold">Driver App - Real Auth</h1>
            </div>
            <CardTitle className="text-2xl">Sign in with Supabase</CardTitle>
            <CardDescription>
              Real authentication powered by Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Real Test Accounts */}
        <Card className="shadow-custom-xl bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Real Test Accounts</CardTitle>
            <CardDescription>
              These are actual Supabase Auth users linked to driver records in the database. Click to auto-fill credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoAccounts.map((account, index) => (
              <div key={index} className="space-y-2">
                <div
                  className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer transition-colors"
                  onClick={() => fillCredentials(account.email, account.password)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${account.color} text-white`}>
                      <account.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{account.role}</h3>
                      <p className="text-sm text-muted-foreground">{account.description}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p><strong>Email:</strong> {account.email}</p>
                    <p><strong>Password:</strong> {account.password}</p>
                  </div>
                </div>
                {index < demoAccounts.length - 1 && <Separator />}
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ✅ Real Supabase authentication with proper roles and permissions
              </p>
              <div className="space-y-2 mt-2">
                <Button 
                  onClick={createDevUsers} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled={isLoading}
                >
                  Create Development Users
                </Button>
                <div className="grid grid-cols-2 gap-1">
                  <Button 
                    onClick={() => quickLogin('admin@pantabilen.se', 'SecurePass123!')}
                    variant="outline" 
                    size="sm"
                    disabled={isLoading}
                  >
                    Quick: Admin
                  </Button>
                  <Button 
                    onClick={() => quickLogin('admin@demoscrapyard.se', 'SecurePass123!')}
                    variant="outline" 
                    size="sm"
                    disabled={isLoading}
                  >
                    Quick: Tenant
                  </Button>
                  <Button 
                    onClick={() => quickLogin('erik@pantabilen.se', 'SecurePass123!')}
                    variant="outline" 
                    size="sm"
                    disabled={isLoading}
                  >
                    Quick: Erik
                  </Button>
                  <Button 
                    onClick={() => quickLogin('anna@pantabilen.se', 'SecurePass123!')}
                    variant="outline" 
                    size="sm"
                    disabled={isLoading}
                  >
                    Quick: Anna
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;