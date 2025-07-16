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
  Globe
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
        return <MessageSquare className="h-4 w-4" />;
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
                <td className="border border-gray-200 p-3 text-center">❌</td>
                <td className="border border-gray-200 p-3 text-center">
                  <Button variant="outline" size="sm">
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
                <Button variant="outline" size="sm">
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

  const GoogleMapsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Map className="h-5 w-5" />
            <span>Google Maps Integration</span>
          </CardTitle>
          <CardDescription>
            Manage Google Maps API keys and tenant locations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maps-api-key">API Key</Label>
              <Input 
                id="maps-api-key"
                type="password" 
                placeholder="Enter Google Maps API key"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maps-region">Region Lock</Label>
              <select className="w-full border rounded px-3 py-2 mt-1">
                <option value="">No restriction</option>
                <option value="SE">Sweden</option>
                <option value="NO">Norway</option>
                <option value="DK">Denmark</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <TestTube className="h-3 w-3 mr-1" />
              Test Connection
            </Button>
            <Badge variant="outline">Usage: 1,450/2,000 daily</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Tenant Locations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <Map className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">Interactive map showing tenant locations</p>
            <p className="text-sm text-gray-500 mt-1">
              This would display a Google Maps component with tenant markers
            </p>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="payments">Payment Systems</TabsTrigger>
          <TabsTrigger value="maps">Google Maps</TabsTrigger>
          <TabsTrigger value="health">Health Panel</TabsTrigger>
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