import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Shield, Car, Recycle, Smartphone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log('User is already logged in, redirecting to driver app');
      navigate('/driver-app', { replace: true });
    }
  }, [user, loading, navigate]);

  // Create test users on component mount if they don't exist
  useEffect(() => {
    const initializeTestUsers = async () => {
      try {
        console.log('Initializing test users...');
        await createTestUsersIfNeeded();
      } catch (error) {
        console.error('Failed to initialize test users:', error);
      }
    };
    
    initializeTestUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Login attempt with:', email);
      const { error: loginError } = await login(email, password);
      
      if (loginError) {
        setError(loginError.message || 'An error occurred during login');
      } else {
        console.log('Login successful, will redirect automatically');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createTestUsersIfNeeded = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-test-users');
      if (error) {
        console.error('Error creating test users:', error);
      } else {
        console.log('Test users setup completed:', data);
      }
    } catch (error) {
      console.error('Error invoking create-test-users function:', error);
    }
  };

  const demoAccounts = [
    {
      role: 'Driver - Erik',
      email: 'erik@pantabilen.se',
      password: 'SecurePass123!',
      description: 'Real Supabase auth user - Erik Andersson driver account',
      icon: Car,
      color: 'bg-purple-600'
    },
    {
      role: 'Driver - Anna',
      email: 'anna@pantabilen.se',
      password: 'SecurePass123!',
      description: 'Real Supabase auth user - Anna Johansson driver account',
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
                ✅ These users are stored in Supabase Auth and linked to driver records
              </p>
              <Button 
                onClick={createTestUsersIfNeeded} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Create/Update Test Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;