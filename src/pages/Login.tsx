import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building2, Shield, Car, Recycle, Smartphone } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      // Navigate to main dashboard after successful login
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      // Error handling is done in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Super Admin',
      email: 'admin@pantabilen.se',
      password: 'admin123',
      description: 'Full platform access - all tenants, users, and system configuration',
      icon: Shield,
      color: 'bg-red-600'
    },
    {
      role: 'Tenant Admin - Stockholm',
      email: 'admin@stockholm.pantabilen.se',
      password: 'stockholm123',
      description: 'Stockholm tenant management - drivers, customers, orders',
      icon: Building2,
      color: 'bg-blue-600'
    },
    {
      role: 'Tenant Admin - Göteborg',
      email: 'admin@goteborg.pantabilen.se',
      password: 'goteborg123',
      description: 'Göteborg tenant management - separate tenant operations',
      icon: Building2,
      color: 'bg-green-600'
    },
    {
      role: 'Scrapyard Admin',
      email: 'admin@skrot.stockholm.se',
      password: 'skrot123',
      description: 'Scrapyard operations - vehicle processing and logistics',
      icon: Recycle,
      color: 'bg-orange-600'
    },
    {
      role: 'Driver - Erik',
      email: 'erik@pantabilen.se',
      password: 'driver123',
      description: 'Vehicle pickup driver - mobile app and route management',
      icon: Car,
      color: 'bg-purple-600'
    },
    {
      role: 'Driver - Anna',
      email: 'anna@pantabilen.se',
      password: 'driver123',
      description: 'Vehicle pickup driver - alternative driver account',
      icon: Car,
      color: 'bg-indigo-600'
    },
    {
      role: 'Customer',
      email: 'customer@example.se',
      password: 'customer123',
      description: 'Customer portal - submit car recycling requests and track status',
      icon: Car,
      color: 'bg-teal-600'
    }
  ];

  const fillCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="shadow-custom-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-brand-blue" />
              <h1 className="text-2xl font-bold">Car Recycling Platform</h1>
            </div>
            <CardTitle className="text-2xl">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="shadow-custom-xl bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Test Accounts</CardTitle>
            <CardDescription>
              Click on any account to automatically fill credentials. Each account provides different access levels for testing functionality.
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;