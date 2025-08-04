import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, CreditCard, BarChart3, Settings, LogOut, Plus, TrendingUp, Globe, Bug, Truck, Navigation, UserCheck } from 'lucide-react';
import { TenantSetupForm } from './TenantSetupForm';
import { TenantList } from './TenantList';
import APIConnectionsPanel from './API/APIConnectionsPanel';
import TenantManagement from './TenantManagement';
import UserManagement from './UserManagement';
import DriverManagement from './DriverManagement';
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

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  time: string;
  timestamp: Date;
  type: 'tenant' | 'request' | 'payment' | 'user';
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
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    fetchTenants();
    fetchRecentActivity();
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

  const fetchRecentActivity = async () => {
    try {
      setActivitiesLoading(true);
      const activities: ActivityItem[] = [];

      // Fetch recent tenants
      const { data: recentTenants } = await supabase
        .from('tenants')
        .select('tenants_id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentTenants) {
        recentTenants.forEach(tenant => {
          activities.push({
            id: `tenant-${tenant.tenants_id}`,
            action: 'New tenant registered',
            entity: tenant.name,
            time: formatTimeAgo(tenant.created_at),
            timestamp: new Date(tenant.created_at),
            type: 'tenant'
          });
        });
      }

      // Fetch recent customer requests
      const { data: recentRequests } = await supabase
        .from('customer_requests')
        .select('id, owner_name, created_at, status')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentRequests) {
        recentRequests.forEach(request => {
          activities.push({
            id: `request-${request.id}`,
            action: `Customer request ${request.status}`,
            entity: request.owner_name,
            time: formatTimeAgo(request.created_at),
            timestamp: new Date(request.created_at),
            type: 'request'
          });
        });
      }

      // Fetch recent invoices/payments
      const { data: recentInvoices } = await supabase
        .from('scrapyard_invoices')
        .select('id, invoice_number, payment_date, created_at, scrapyard_id')
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentInvoices) {
        recentInvoices.forEach(invoice => {
          if (invoice.payment_date) {
            activities.push({
              id: `payment-${invoice.id}`,
              action: 'Payment processed',
              entity: `Invoice ${invoice.invoice_number}`,
              time: formatTimeAgo(invoice.payment_date),
              timestamp: new Date(invoice.payment_date),
              type: 'payment'
            });
          } else {
            activities.push({
              id: `invoice-${invoice.id}`,
              action: 'Invoice created',
              entity: `Invoice ${invoice.invoice_number}`,
              time: formatTimeAgo(invoice.created_at),
              timestamp: new Date(invoice.created_at),
              type: 'payment'
            });
          }
        });
      }

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Take only the 6 most recent activities
      setActivities(activities.slice(0, 6));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return `${diffInDays} days ago`;
    }
  };

  const handleTenantClick = (tenantId: number) => {
    setSelectedTenantId(tenantId);
    setShowTenantManagement(true);
  };

  const handleTenantCreated = (tenant: any) => {
    console.log('New tenant created:', tenant);
    fetchTenants(); // Refresh the tenant list
    fetchRecentActivity(); // Refresh activity feed
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
      title: 'Active Drivers',
      value: '24',
      change: '+4 this week',
      icon: Truck,
      color: 'bg-status-completed'
    },
    {
      title: 'Fleet Utilization',
      value: '78%',
      change: '+5% vs last month',
      icon: Navigation,
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
              {activitiesLoading ? (
                <div className="text-center py-4">Loading activities...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No recent activity</div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-admin-accent/20 rounded-lg">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.entity}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{activity.time}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
