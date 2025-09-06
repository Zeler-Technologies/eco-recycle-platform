import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Settings, Users, TrendingUp, Loader2 } from 'lucide-react';
import { UsageTrackingService } from '@/services/UsageTrackingService';

interface ServiceCostModel {
  id: string;
  service_name: string;
  cost_type: 'fixed_monthly' | 'usage_based' | 'shared_base';
  base_cost_monthly: number | null;
  unit_cost: number | null;
  allocation_method: string;
  created_at: string;
}

interface Tenant {
  tenants_id: number;
  name: string;
  country: string;
}

interface BillingDashboardProps {
  onBack?: () => void;
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState<ServiceCostModel[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchServices(), fetchTenants()]).finally(() => setLoading(false));
  }, []);

  const fetchServices = async () => {
    try {
      // Mock service data since RPC functions don't exist yet
      const mockServices: ServiceCostModel[] = [
        {
          id: 'sms_service',
          service_name: 'SMS Service',
          cost_type: 'usage_based',
          base_cost_monthly: null,
          unit_cost: 0.04,
          allocation_method: 'direct',
          created_at: new Date().toISOString()
        },
        {
          id: 'google_maps',
          service_name: 'Google Maps API',
          cost_type: 'shared_base',
          base_cost_monthly: 500,
          unit_cost: 0.005,
          allocation_method: 'usage_weighted',
          created_at: new Date().toISOString()
        },
        {
          id: 'car_processing',
          service_name: 'Car Processing',
          cost_type: 'usage_based',
          base_cost_monthly: null,
          unit_cost: 2.00,
          allocation_method: 'direct',
          created_at: new Date().toISOString()
        }
      ];
      setServices(mockServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive"
      });
    }
  };

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('tenants_id, name, country')
        .order('name');
      
      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Billing & Invoice Control</h1>
          <p className="text-muted-foreground">Multi-tenant billing management system</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="tenants">Per Tenant</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab services={services} tenants={tenants} />
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <ServicePricingTab services={services} onRefresh={fetchServices} />
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <TenantBillingTab tenants={tenants} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const OverviewTab: React.FC<{ services: ServiceCostModel[]; tenants: Tenant[] }> = ({ services, tenants }) => {
  const [sharedCosts, setSharedCosts] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchSharedCosts();
    fetchRevenueSummary();
  }, [selectedMonth]);

  const fetchSharedCosts = async () => {
    try {
      // Mock shared cost data for demonstration
      const mockSharedCosts = [
        {
          tenant_id: 1,
          base_cost_allocation: 150,
          service_name: 'google_maps_api'
        },
        {
          tenant_id: 2,
          base_cost_allocation: 200,
          service_name: 'google_maps_api'
        },
        {
          tenant_id: 3,
          base_cost_allocation: 150,
          service_name: 'google_maps_api'
        }
      ];
      
      setSharedCosts(mockSharedCosts);
    } catch (error) {
      console.error('Error fetching shared costs:', error);
    }
  };

  const fetchRevenueSummary = async () => {
    try {
      // Mock revenue calculation
      const total = 1250; // Example total
      setTotalRevenue(total);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+0%</div>
            <p className="text-xs text-muted-foreground">No historical data</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Google Maps API Shared Cost Allocation</CardTitle>
              <CardDescription>€500/month base cost split by usage percentage</CardDescription>
            </div>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardHeader>
        <CardContent>
          {sharedCosts.length > 0 ? (
            <div className="space-y-3">
              {sharedCosts.map((allocation, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div>
                    <span className="font-medium">Tenant {allocation.tenant_id}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({((allocation.base_cost_allocation / 500) * 100).toFixed(1)}% usage)
                    </span>
                  </div>
                  <span className="text-lg font-semibold">
                    €{allocation.base_cost_allocation.toFixed(2)}
                  </span>
                </div>
              ))}
              
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Total Allocated:</span>
                  <span>€{sharedCosts.reduce((sum, item) => sum + item.base_cost_allocation, 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No shared cost allocations found for {selectedMonth}</p>
          )}
          
          <Button 
            onClick={() => {
              console.log("Shared cost allocation would be calculated here with real RPC functions");
            }}
            className="w-full mt-4"
          >
            Calculate Shared Costs for {selectedMonth}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const ServicePricingTab: React.FC<{ services: ServiceCostModel[]; onRefresh: () => void }> = ({ services, onRefresh }) => {
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const { toast } = useToast();

  const handleEdit = (service: ServiceCostModel) => {
    setEditingService(service.id);
    setEditValues({
      unit_cost: service.unit_cost,
      base_cost_monthly: service.base_cost_monthly
    });
  };

  const handleSave = async (serviceId: string) => {
    try {
      // Mock save functionality
      setEditingService(null);
      onRefresh();
      
      toast({
        title: "Success",
        description: "Service pricing would be updated with real backend",
      });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service pricing",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Pricing Configuration</CardTitle>
        <CardDescription>Configure pricing for individual services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{service.service_name}</h3>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
                    <Badge variant="secondary">{service.cost_type}</Badge>
                    {service.cost_type === 'fixed_monthly' && (
                      <span>€{service.base_cost_monthly}/month</span>
                    )}
                    {service.cost_type === 'usage_based' && (
                      <span>€{service.unit_cost} per unit</span>
                    )}
                    {service.cost_type === 'shared_base' && (
                      <span>€{service.base_cost_monthly}/month + €{service.unit_cost} per unit</span>
                    )}
                  </div>
                </div>
                
                {editingService === service.id ? (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(service.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingService(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(service)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              {editingService === service.id && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {service.cost_type !== 'fixed_monthly' && (
                    <div>
                      <Label>Unit Cost (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.unit_cost}
                        onChange={(e) => setEditValues({...editValues, unit_cost: parseFloat(e.target.value)})}
                      />
                    </div>
                  )}
                  {service.cost_type !== 'usage_based' && (
                    <div>
                      <Label>Monthly Base Cost (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.base_cost_monthly}
                        onChange={(e) => setEditValues({...editValues, base_cost_monthly: parseFloat(e.target.value)})}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

const TenantBillingTab: React.FC<{ tenants: Tenant[] }> = ({ tenants }) => {
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [billingData, setBillingData] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantBilling();
    }
  }, [selectedTenant, selectedMonth]);

  const fetchTenantBilling = async () => {
    if (!selectedTenant) return;
    
    try {
      // Mock billing data
      const mockBillingData = {
        service_breakdown: {
          'SMS Service': {
            total_units: 150,
            total_cost: 6.00,
            cost_type: 'usage_based'
          },
          'Google Maps API': {
            total_units: 1000,
            total_cost: 5.00,
            cost_type: 'shared_base'
          },
          'Car Processing': {
            total_units: 12,
            total_cost: 24.00,
            cost_type: 'usage_based'
          }
        },
        total_cost: 35.00
      };
      
      setBillingData(mockBillingData);
    } catch (error) {
      console.error('Error fetching tenant billing:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per Tenant Billing</CardTitle>
        <CardDescription>View and manage billing for individual tenants</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Select Tenant</Label>
            <Select value={selectedTenant?.toString() || ''} onValueChange={(value) => setSelectedTenant(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tenant..." />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.tenants_id} value={tenant.tenants_id.toString()}>
                    {tenant.name} ({tenant.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Billing Month</Label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>

        {billingData && (
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-900">€{billingData.total_cost.toFixed(2)}</p>
                  <p className="text-blue-700 mt-1">Total Monthly Cost</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {Object.entries(billingData.service_breakdown).map(([serviceName, service]: [string, any]) => (
                <Card key={serviceName}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{serviceName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {service.total_units} units used
                        </p>
                      </div>
                      <span className="text-lg font-semibold">
                        €{service.total_cost.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Button className="w-full">
              Generate Invoice for {selectedMonth}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AnalyticsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Dashboard</CardTitle>
        <CardDescription>
          Usage analytics and reporting will appear here once usage data is available
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Analytics Coming Soon</p>
          <p className="text-sm mt-2">
            Revenue trends, usage patterns, and performance metrics will be available here
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingDashboard;