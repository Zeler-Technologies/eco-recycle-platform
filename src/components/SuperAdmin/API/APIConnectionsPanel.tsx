import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, 
  Map, 
  MessageSquare, 
  Shield, 
  Database, 
  Activity, 
  Bell,
  Settings,
  TestTube,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  Globe,
  Phone
} from 'lucide-react';

interface APIService {
  id: string;
  name: string;
  category: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  usage: {
    current: number;
    limit: number;
    period: string;
  };
  latency: number;
  uptime: number;
}

interface Tenant {
  id: string;
  name: string;
  country: string;
  services: Record<string, APIService>;
}

const APIConnectionsPanel = () => {
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [editingService, setEditingService] = useState<string | null>(null);

  // Mock data - in real app, this would come from Supabase
  const tenants: Tenant[] = [
    {
      id: '1',
      name: 'ScrapYard AB',
      country: 'SE',
      services: {
        stripe: {
          id: 'stripe-1',
          name: 'Stripe',
          category: 'payment',
          provider: 'Stripe',
          status: 'connected',
          lastSync: '2024-01-15T10:30:00Z',
          usage: { current: 287, limit: 500, period: 'daily' },
          latency: 45,
          uptime: 99.9
        },
        swish: {
          id: 'swish-1',
          name: 'Swish',
          category: 'payment',
          provider: 'Swish',
          status: 'disconnected',
          lastSync: '2024-01-14T08:15:00Z',
          usage: { current: 0, limit: 1000, period: 'daily' },
          latency: 0,
          uptime: 0
        },
        maps: {
          id: 'maps-1',
          name: 'Google Maps',
          category: 'location',
          provider: 'Google',
          status: 'connected',
          lastSync: '2024-01-15T10:25:00Z',
          usage: { current: 1450, limit: 2000, period: 'daily' },
          latency: 120,
          uptime: 98.5
        },
        sms: {
          id: 'sms-1',
          name: 'SMS Service',
          category: 'messaging',
          provider: 'Twilio',
          status: 'connected',
          lastSync: '2024-01-15T10:20:00Z',
          usage: { current: 245, limit: 1000, period: 'daily' },
          latency: 85,
          uptime: 99.2
        }
      }
    },
    {
      id: '2',
      name: 'NordPlock AS',
      country: 'NO',
      services: {
        stripe: {
          id: 'stripe-2',
          name: 'Stripe',
          category: 'payment',
          provider: 'Stripe',
          status: 'connected',
          lastSync: '2024-01-15T10:28:00Z',
          usage: { current: 156, limit: 500, period: 'daily' },
          latency: 52,
          uptime: 99.8
        },
        vipps: {
          id: 'vipps-2',
          name: 'Vipps',
          category: 'payment',
          provider: 'Vipps',
          status: 'connected',
          lastSync: '2024-01-15T10:20:00Z',
          usage: { current: 89, limit: 300, period: 'daily' },
          latency: 38,
          uptime: 99.5
        },
        sms: {
          id: 'sms-2',
          name: 'SMS Service',
          category: 'messaging',
          provider: 'MessageBird',
          status: 'error',
          lastSync: '2024-01-15T09:15:00Z',
          usage: { current: 67, limit: 500, period: 'daily' },
          latency: 150,
          uptime: 95.8
        }
      }
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'bg-green-100 text-green-800',
      error: 'bg-yellow-100 text-yellow-800',
      disconnected: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'location':
        return <Map className="h-4 w-4" />;
      case 'messaging':
        return <Phone className="h-4 w-4" />;
      case 'auth':
        return <Shield className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'monitoring':
        return <Activity className="h-4 w-4" />;
      case 'notifications':
        return <Bell className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const APIServiceMatrix = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Configuration Matrix</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="tenant-filter">Filter by tenant:</Label>
          <select 
            id="tenant-filter" 
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="all">All Tenants</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-200 p-3 text-left">Tenant</th>
              <th className="border border-gray-200 p-3 text-center">Stripe</th>
              <th className="border border-gray-200 p-3 text-center">Swish</th>
              <th className="border border-gray-200 p-3 text-center">Vipps</th>
              <th className="border border-gray-200 p-3 text-center">Google Maps</th>
              <th className="border border-gray-200 p-3 text-center">SMS</th>
              <th className="border border-gray-200 p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{tenant.country === 'SE' ? '🇸🇪' : '🇳🇴'}</span>
                    <span className="font-medium">{tenant.name}</span>
                  </div>
                </td>
                <td className="border border-gray-200 p-3 text-center">
                  {tenant.services.stripe ? getStatusIcon(tenant.services.stripe.status) : '❌'}
                </td>
                <td className="border border-gray-200 p-3 text-center">
                  {tenant.services.swish ? getStatusIcon(tenant.services.swish.status) : '❌'}
                </td>
                <td className="border border-gray-200 p-3 text-center">
                  {tenant.services.vipps ? getStatusIcon(tenant.services.vipps.status) : '❌'}
                </td>
                <td className="border border-gray-200 p-3 text-center">
                  {tenant.services.maps ? getStatusIcon(tenant.services.maps.status) : '❌'}
                </td>
                <td className="border border-gray-200 p-3 text-center">
                  {tenant.services.sms ? getStatusIcon(tenant.services.sms.status) : '❌'}
                </td>
                <td className="border border-gray-200 p-3 text-center">
                  <Button variant="outline" size="sm" className="bg-background hover:bg-muted text-foreground">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const MonitoringDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tenants.flatMap(tenant => 
        Object.values(tenant.services).map(service => (
          <Card key={`${tenant.id}-${service.id}`} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(service.category)}
                  <span className="font-medium">{service.name}</span>
                </div>
                {getStatusIcon(service.status)}
              </div>
              <p className="text-sm text-gray-600">{tenant.name}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage:</span>
                <span className="font-medium">
                  {service.usage.current}/{service.usage.limit} {service.usage.period}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(service.usage.current / service.usage.limit) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>Uptime:</span>
                <span className="font-medium">{service.uptime}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Latency:</span>
                <span className="font-medium">{service.latency}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Sync:</span>
                <span className="text-gray-600">
                  {new Date(service.lastSync).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const PaymentSystemsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Provider Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure payment systems with provider-specific settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {['Stripe', 'Swish', 'Vipps', 'PayPal'].map(provider => (
            <div key={provider} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">{provider}</span>
                  {provider === 'Vipps' && <span className="text-sm text-gray-500">(Norway only)</span>}
                  {provider === 'Swish' && <span className="text-sm text-gray-500">(Sweden only)</span>}
                </div>
                <Switch defaultChecked={provider === 'Stripe'} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${provider}-api-key`}>API Key</Label>
                  <Input 
                    id={`${provider}-api-key`}
                    type="password" 
                    placeholder="Enter API key"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`${provider}-webhook`}>Webhook URL</Label>
                  <Input 
                    id={`${provider}-webhook`}
                    placeholder="Enter webhook URL"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <Button variant="outline" size="sm" className="bg-background hover:bg-muted text-foreground">
                  <TestTube className="h-3 w-3 mr-1" />
                  Test Connection
                </Button>
                <Badge variant="outline">Test Environment</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Transaction Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$298,570</div>
              <div className="text-sm text-gray-600">Monthly Volume</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">98.4%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">1,847</div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const GoogleMapsTab = () => {
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState('');

    const handleSaveApiKey = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would save to Supabase secrets
        // For now, we'll simulate the API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTestResult('API key saved successfully');
        
        // TODO: Implement actual Supabase secrets save
        console.log('Saving Google Maps API key:', apiKey);
      } catch (error) {
        setTestResult('Failed to save API key');
      } finally {
        setIsLoading(false);
      }
    };

    const handleTestConnection = async () => {
      if (!apiKey) {
        setTestResult('Please enter an API key first');
        return;
      }

      setIsLoading(true);
      try {
        // Test the Google Maps API key
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Stockholm,Sweden&key=${apiKey}`);
        const data = await response.json();
        
        if (data.status === 'OK') {
          setTestResult('✅ Connection successful! API key is valid.');
        } else {
          setTestResult(`❌ Connection failed: ${data.error_message || data.status}`);
        }
      } catch (error) {
        setTestResult('❌ Connection test failed');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Map className="h-5 w-5" />
              <span>Google Maps Integration</span>
            </CardTitle>
            <CardDescription>
              Manage Google Maps API keys for address autocomplete and pickup location mapping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="maps-api-key">Google Maps API Key</Label>
                <div className="flex space-x-2 mt-1">
                  <Input 
                    id="maps-api-key"
                    type="password" 
                    placeholder="Enter Google Maps API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSaveApiKey}
                    disabled={isLoading || !apiKey}
                    size="sm"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  This key will be used for address autocomplete and location mapping in the customer app
                </p>
              </div>
              <div>
                <Label htmlFor="maps-region">Region Lock</Label>
                <select className="w-full border rounded px-3 py-2 mt-1" id="maps-region">
                  <option value="">No restriction</option>
                  <option value="SE" selected>Sweden</option>
                  <option value="NO">Norway</option>
                  <option value="DK">Denmark</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Restrict API usage to specific regions for security
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTestConnection}
                disabled={isLoading || !apiKey}
                className="bg-background hover:bg-muted text-foreground"
              >
                <TestTube className="h-3 w-3 mr-1" />
                {isLoading ? 'Testing...' : 'Test Connection'}
              </Button>
              <Badge variant="outline">Usage: 1,450/2,000 daily</Badge>
            </div>
            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${
                testResult.includes('✅') ? 'bg-green-50 text-green-800' : 
                testResult.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
              }`}>
                {testResult}
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How to get your Google Maps API Key:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the Maps JavaScript API and Places API</li>
                <li>Go to Credentials and create an API key</li>
                <li>Restrict the API key to your domain for security</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Integration Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Address Autocomplete</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Interactive Maps</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Map className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Geocoding Service</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const SMSTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>SMS Service Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure SMS services with multiple provider support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {['Twilio', 'MessageBird', 'Clickatell', 'Nexmo'].map(provider => (
            <div key={provider} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">{provider}</span>
                  <Badge variant="outline" className="text-xs">
                    {provider === 'Twilio' ? 'Primary' : 'Backup'}
                  </Badge>
                </div>
                <Switch defaultChecked={provider === 'Twilio' || provider === 'MessageBird'} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${provider}-api-key`}>API Key</Label>
                  <Input 
                    id={`${provider}-api-key`}
                    type="password" 
                    placeholder="Enter API key"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`${provider}-sender-id`}>Sender ID</Label>
                  <Input 
                    id={`${provider}-sender-id`}
                    placeholder="Enter sender ID"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor={`${provider}-webhook`}>Webhook URL</Label>
                  <Input 
                    id={`${provider}-webhook`}
                    placeholder="Enter webhook URL"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`${provider}-region`}>Region</Label>
                  <select className="w-full border rounded px-3 py-2 mt-1">
                    <option value="global">Global</option>
                    <option value="eu">Europe</option>
                    <option value="us">United States</option>
                    <option value="ap">Asia Pacific</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <Button variant="outline" size="sm" className="bg-background hover:bg-muted text-foreground">
                  <TestTube className="h-3 w-3 mr-1" />
                  Test Connection
                </Button>
                <Button variant="outline" size="sm" className="bg-background hover:bg-muted text-foreground">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Send Test SMS
                </Button>
                <Badge variant="outline">Production Environment</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>SMS Usage Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">2,847</div>
              <div className="text-sm text-gray-600">Messages Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">98.9%</div>
              <div className="text-sm text-gray-600">Delivery Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">$284.50</div>
              <div className="text-sm text-gray-600">Monthly Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">157ms</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">API Connections</h1>
        <p className="text-gray-600 mt-2">
          Monitor and configure API service connections across all tenants
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-admin-primary">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Overview</TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Monitoring</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Payment Systems</TabsTrigger>
          <TabsTrigger value="sms" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">SMS</TabsTrigger>
          <TabsTrigger value="maps" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Google Maps</TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Health Panel</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <APIServiceMatrix />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <MonitoringDashboard />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentSystemsTab />
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <SMSTab />
        </TabsContent>

        <TabsContent value="maps" className="space-y-6">
          <GoogleMapsTab />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Tenant Health Panel</CardTitle>
              <CardDescription>
                Monitor tenant health metrics and service usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenants.map(tenant => (
                  <Card key={tenant.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{tenant.country === 'SE' ? '🇸🇪' : '🇳🇴'}</span>
                          <span className="font-semibold">{tenant.name}</span>
                        </div>
                        <Badge variant="outline">
                          {Object.keys(tenant.services).length} services
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>API Usage:</span>
                          <span className="font-medium">8,750/10,000 calls</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Storage:</span>
                          <span className="font-medium">2.4 GB / 5 GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Integrations:</span>
                          <div className="flex space-x-1">
                            {Object.values(tenant.services).map(service => (
                              <span key={service.id} className="text-xs">
                                {getCategoryIcon(service.category)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APIConnectionsPanel;