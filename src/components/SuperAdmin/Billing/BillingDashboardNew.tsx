import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { UsageTrackingService } from '@/services/UsageTrackingService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, TrendingUp, Users, DollarSign } from 'lucide-react';

interface ServiceCostModel {
  id: string;
  service_name: string;
  cost_type: 'fixed_monthly' | 'usage_based' | 'shared_base';
  base_cost_monthly: number | null;
  unit_cost: number | null;
  allocation_method: 'usage_weighted' | 'equal_split' | 'direct';
  created_at: string;
}

interface Tenant {
  tenants_id: number;
  name: string;
  country: string;
}

interface UsageSummary {
  [serviceName: string]: {
    total_units: number;
    total_cost: number;
    base_cost_allocation: number;
    cost_type: string;
  };
}

const BillingDashboardNew: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState<ServiceCostModel[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary>({});
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchServices(), fetchTenants()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantUsage();
    }
  }, [selectedTenant]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('service_cost_models' as any)
        .select('*')
        .order('service_name');
      
      if (error) throw error;
      setServices((data as any) || []);
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

  const fetchTenantUsage = async () => {
    if (!selectedTenant) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const startDate = `${currentMonth}-01`;
      const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString().split('T')[0];

      const summary = await UsageTrackingService.getUsageSummary(
        selectedTenant,
        startDate,
        endDate
      );

      setUsageSummary(summary || {});
    } catch (error) {
      console.error('Error fetching tenant usage:', error);
    }
  };

  const updateServicePricing = async (serviceId: string, unitCost: number) => {
    try {
      const { error } = await supabase
        .from('service_cost_models' as any)
        .update({ unit_cost: unitCost })
        .eq('id', serviceId);

      if (error) throw error;

      await fetchServices();
      setEditingService(null);
      
      toast({
        title: "Success",
        description: "Service pricing updated",
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

  const ServiceConfigCard: React.FC<{ service: ServiceCostModel }> = ({ service }) => {
    const [newPrice, setNewPrice] = useState(service.unit_cost?.toString() || '');

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">{service.service_name}</CardTitle>
            <CardDescription>
              {service.cost_type === 'fixed_monthly' && 'Fixed Monthly Cost'}
              {service.cost_type === 'usage_based' && 'Usage-Based Pricing'}
              {service.cost_type === 'shared_base' && 'Shared Base Cost + Usage'}
            </CardDescription>
          </div>
          <Badge variant={service.cost_type === 'fixed_monthly' ? 'default' : 'secondary'}>
            {service.cost_type}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {service.cost_type === 'fixed_monthly' && (
              <p className="text-2xl font-bold">€{service.base_cost_monthly}/month</p>
            )}
            {service.cost_type === 'usage_based' && (
              <p className="text-2xl font-bold">€{service.unit_cost} per unit</p>
            )}
            {service.cost_type === 'shared_base' && (
              <div>
                <p className="text-lg font-semibold">€{service.base_cost_monthly}/month base</p>
                <p className="text-sm text-muted-foreground">+ €{service.unit_cost} per unit</p>
              </div>
            )}
            
            {editingService === service.id ? (
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Price"
                />
                <Button 
                  size="sm" 
                  onClick={() => updateServicePricing(service.id, parseFloat(newPrice))}
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
                onClick={() => setEditingService(service.id)}
                className="mt-2"
              >
                <Settings className="w-4 h-4 mr-1" />
                Edit Pricing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const TenantUsageDisplay: React.FC = () => {
    const totalCost = Object.values(usageSummary).reduce(
      (sum, service) => sum + service.total_cost + service.base_cost_allocation, 
      0
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="tenant-select">Select Tenant</Label>
            <Select onValueChange={(value) => setSelectedTenant(parseInt(value))}>
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
        </div>

        {selectedTenant && (
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Monthly Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€{totalCost.toFixed(2)}</p>
                <p className="text-muted-foreground">Current month usage</p>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              {Object.entries(usageSummary).map(([serviceName, data]) => (
                <Card key={serviceName}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{serviceName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {data.total_units} units used
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          €{(data.total_cost + data.base_cost_allocation).toFixed(2)}
                        </p>
                        {data.base_cost_allocation > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Base: €{data.base_cost_allocation.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button className="w-full">
              Generate Invoice
            </Button>
          </div>
        )}
      </div>
    );
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
      <div>
        <h1 className="text-3xl font-bold">Billing & Invoice Control</h1>
        <p className="text-muted-foreground">Multi-tenant billing management system</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="per-tenant">Per Tenant</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                <div className="text-2xl font-bold">€0.00</div>
                <p className="text-xs text-muted-foreground">No usage data yet</p>
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
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceConfigCard key={service.id} service={service} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="per-tenant" className="space-y-6">
          <TenantUsageDisplay />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Usage analytics and reporting will appear here once usage data is available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Start recording usage to see analytics and trends.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingDashboardNew;