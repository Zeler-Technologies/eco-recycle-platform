import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, CreditCard, BarChart3, Settings, LogOut, Plus, TrendingUp, Globe, Bug } from 'lucide-react';
import { TenantSetupForm } from './TenantSetupForm';
import { TenantList } from './TenantList';
import APIConnectionsPanel from './API/APIConnectionsPanel';
import TenantManagement from './TenantManagement';
import UserManagement from './UserManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Tenant {
  tenants_id: number;
  name: string;
  country: string;
  service_type: string;
  base_address: string;
  invoice_email: string;
  created_at: string;
}

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [showAPIConnections, setShowAPIConnections] = useState(false);
  const [showTenantManagement, setShowTenantManagement] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showTenantList, setShowTenantList] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tenants data
  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4); // Only get the 4 most recent for the dashboard

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantClick = (tenantId: number) => {
    setSelectedTenantId(tenantId);
    setShowTenantManagement(true);
  };

  const handleTenantCreated = (tenant: any) => {
    console.log('New tenant created:', tenant);
    fetchTenants(); // Refresh the tenant list
  };
  if (showAPIConnections) {
    return (
      <div className="theme-admin min-h-screen bg-admin-muted">
        <header className="bg-admin-primary text-admin-primary-foreground shadow-custom-md">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAPIConnections(false)}
                  className="flex items-center gap-2 text-admin-primary-foreground hover:text-admin-primary-foreground/80 transition-colors"
                >
                  <Building2 className="h-6 w-6" />
                  <span>← Back to Dashboard</span>
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-admin-primary-foreground/80">{user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-admin-primary-foreground/30 text-admin-primary-foreground hover:bg-admin-primary-foreground/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>
        <APIConnectionsPanel />
      </div>
    );
  }

  if (showTenantManagement) {
    return <TenantManagement 
      onBack={() => {
        setShowTenantManagement(false);
        setSelectedTenantId(null);
      }} 
      selectedTenantId={selectedTenantId}
    />;
  }

  if (showUserManagement) {
    return <UserManagement onBack={() => setShowUserManagement(false)} />;
  }

  if (showTenantList) {
    return (
      <div className="theme-admin min-h-screen bg-admin-muted">
        <header className="bg-admin-primary text-admin-primary-foreground shadow-custom-md">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTenantList(false)}
                  className="flex items-center gap-2 text-admin-primary-foreground hover:text-admin-primary-foreground/80 transition-colors"
                >
                  <Building2 className="h-6 w-6" />
                  <span>← Back to Dashboard</span>
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-admin-primary-foreground/80">{user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-admin-primary-foreground/30 text-admin-primary-foreground hover:bg-admin-primary-foreground/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>
        <div className="p-6">
          <TenantList />
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Tenants',
      value: tenants.length.toString(),
      change: '+3 this month',
      icon: Building2,
      color: 'bg-admin-primary'
    },
    {
      title: 'Active Users',
      value: '156',
      change: '+12 this week',
      icon: Users,
      color: 'bg-status-completed'
    },
    {
      title: 'Monthly Revenue',
      value: '€24,500',
      change: '+18% vs last month',
      icon: CreditCard,
      color: 'bg-status-processing'
    },
    {
      title: 'Total Orders',
      value: '1,847',
      change: '+124 this week',
      icon: BarChart3,
      color: 'bg-status-pending'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-status-completed text-white';
      case 'Pending': return 'bg-status-processing text-white';
      case 'Suspended': return 'bg-status-cancelled text-white';
      default: return 'bg-muted';
    }
  };


  // Debug function to check current user info
  const debugUser = async () => {
    const { data, error } = await supabase.rpc('debug_lovable_user');
    console.log('Lovable user debug:', data);
    alert(JSON.stringify(data, null, 2));
  };

  // Debug function to test tenant creation
  const debugTenant = async () => {
    const { data, error } = await supabase.rpc('create_tenant_debug', {
      p_name: 'Debug Test',
      p_country: 'Sweden', 
      p_admin_name: 'Test Admin',
      p_admin_email: 'test@example.com'
    });
    console.log('Debug tenant result:', data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <div className="theme-admin min-h-screen bg-admin-muted">
      {/* Header */}
      <header className="bg-admin-primary text-admin-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-admin-primary-foreground/80">Multi-tenant Platform Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-admin-primary-foreground/80">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-admin-primary-foreground/30 text-admin-primary-foreground hover:bg-admin-primary-foreground/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-white shadow-custom-sm hover:shadow-custom-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.color} text-white`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tenant Management */}
          <Card className="lg:col-span-2 bg-white shadow-custom-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-admin-primary">Tenant Management</CardTitle>
                  <CardDescription>Manage scrap yard tenants and their subscriptions</CardDescription>
                </div>
                <TenantSetupForm onTenantCreated={handleTenantCreated} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">Loading tenants...</div>
                ) : tenants.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No tenants found</div>
                ) : (
                  tenants.map((tenant) => (
                    <div key={tenant.tenants_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-admin-accent/30 transition-colors cursor-pointer" onClick={() => handleTenantClick(tenant.tenants_id)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-admin-accent rounded-full">
                          <Building2 className="h-4 w-4 text-admin-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{tenant.name}</h4>
                          <p className="text-sm text-muted-foreground">{tenant.country} • {tenant.service_type || 'Service'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor('Active')}>
                          Active
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{tenant.base_address || 'No address'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tenant.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white shadow-custom-sm">
            <CardHeader>
              <CardTitle className="text-admin-primary">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowTenantList(true)}>
                <Building2 className="h-4 w-4 mr-2" />
                View All Tenants
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowTenantManagement(true)}>
                <Building2 className="h-4 w-4 mr-2" />
                Manage Tenants
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowUserManagement(true)}>
                <Users className="h-4 w-4 mr-2" />
                Hantera Förare
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/billing'}>
                <CreditCard className="h-4 w-4 mr-2" />
                Billing & Invoices
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics & Reports
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowAPIConnections(true)}>
                <Globe className="h-4 w-4 mr-2" />
                API Connections
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={debugUser}>
                <Bug className="h-4 w-4 mr-2" />
                Debug User Info
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={debugTenant}>
                <Plus className="h-4 w-4 mr-2" />
                Debug Tenant Creation
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6 bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle className="text-admin-primary">Recent Activity</CardTitle>
            <CardDescription>Latest platform events and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'New tenant registered', entity: 'Malmö Scrap Co.', time: '2 hours ago' },
                { action: 'Payment processed', entity: 'Panta Bilen Stockholm', time: '4 hours ago' },
                { action: 'User account created', entity: 'admin@oslo-scrap.no', time: '6 hours ago' },
                { action: 'System backup completed', entity: 'Automated backup', time: '8 hours ago' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-admin-accent/20 rounded-lg">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.entity}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;