import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Settings, Users, TrendingUp, Loader2, Calculator } from 'lucide-react';

interface ServiceCostModel {
  id: string;
  service_name: string;
  cost_type: 'fixed_monthly' | 'usage_based' | 'shared_base';
  base_cost_monthly: number | null;
  unit_cost: number | null;
  allocation_method: string;
  created_at: string;
}

interface UsageData {
  service_id: string;
  service_name: string;
  cost_type: string;
  units_used: number;
  unit_cost: number;
  base_cost_allocation: number;
  total_cost: number;
  usage_date: string;
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
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
        },
        {
          id: 'platform_basic',
          service_name: 'Platform Basic',
          cost_type: 'fixed_monthly',
          base_cost_monthly: 49,
          unit_cost: null,
          allocation_method: 'direct',
          created_at: new Date().toISOString()
        },
        {
          id: 'platform_premium',
          service_name: 'Platform Premium',
          cost_type: 'fixed_monthly',
          base_cost_monthly: 149,
          unit_cost: null,
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

  const fetchTenantUsage = async () => {
    if (!selectedTenant) return;

    try {
      // Mock usage data since RPC functions don't exist yet
      const mockUsageData: UsageData[] = [
        {
          service_id: 'sms_service',
          service_name: 'SMS Service',
          cost_type: 'usage_based',
          units_used: 150,
          unit_cost: 0.04,
          base_cost_allocation: 0,
          total_cost: 6.00,
          usage_date: new Date().toISOString().slice(0, 10)
        },
        {
          service_id: 'google_maps',
          service_name: 'Google Maps API',
          cost_type: 'shared_base',
          units_used: 1000,
          unit_cost: 0.005,
          base_cost_allocation: 150,
          total_cost: 5.00,
          usage_date: new Date().toISOString().slice(0, 10)
        },
        {
          service_id: 'car_processing',
          service_name: 'Car Processing',
          cost_type: 'usage_based',
          units_used: 12,
          unit_cost: 2.00,
          base_cost_allocation: 0,
          total_cost: 24.00,
          usage_date: new Date().toISOString().slice(0, 10)
        }
      ];
      
      setUsageData(mockUsageData);
    } catch (error) {
      console.error('Error fetching tenant usage:', error);
      toast({
        title: "Error",
        description: "Failed to fetch usage data",
        variant: "destructive"
      });
    }
  };

  const updateServicePricing = async (serviceId: string, unitCost: number, baseCost?: number) => {
    try {
      // Mock update functionality
      const updatedServices = services.map(service => 
        service.id === serviceId 
          ? { 
              ...service, 
              unit_cost: unitCost,
              base_cost_monthly: baseCost || service.base_cost_monthly
            }
          : service
      );
      
      setServices(updatedServices);
      setEditingService(null);
      
      toast({
        title: "Success",
        description: "Service pricing updated successfully",
      });
    } catch (error) {
      console.error('Error updating service pricing:', error);
      toast({
        title: "Error",
        description: "Failed to update service pricing",
        variant: "destructive"
      });
    }
  };

  const calculateSharedCosts = async () => {
    try {
      // Mock shared cost calculation
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      toast({
        title: "Success",
        description: `Shared costs calculated for ${currentMonth}`,
      });

      // Refresh usage data if tenant is selected
      if (selectedTenant) {
        fetchTenantUsage();
      }
    } catch (error) {
      console.error('Error calculating shared costs:', error);
      toast({
        title: "Error",
        description: "Failed to calculate shared costs",
        variant: "destructive"
      });
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
          <TabsTrigger value="services">Service Pricing</TabsTrigger>
          <TabsTrigger value="per-tenant">Per Tenant</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab 
            services={services} 
            tenants={tenants} 
            usageData={usageData}
            calculateSharedCosts={calculateSharedCosts}
          />
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <ServicePricingTab 
            services={services} 
            editingService={editingService}
            setEditingService={setEditingService}
            updateServicePricing={updateServicePricing}
          />
        </TabsContent>

        <TabsContent value="per-tenant" className="space-y-6">
          <TenantBillingTab 
            tenants={tenants}
            selectedTenant={selectedTenant}
            setSelectedTenant={setSelectedTenant}
            usageData={usageData}
            fetchTenantUsage={fetchTenantUsage}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const OverviewTab: React.FC<{ 
  services: ServiceCostModel[]; 
  tenants: Tenant[];
  usageData: UsageData[];
  calculateSharedCosts: () => void;
}> = ({ services, tenants, usageData, calculateSharedCosts }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const googleMapsAllocations = usageData.filter(item => 
    item.service_name === 'Google Maps API' && item.base_cost_allocation > 0
  );

  const totalAllocated = googleMapsAllocations.reduce(
    (sum, item) => sum + item.base_cost_allocation, 0
  );

  const totalRevenue = usageData.reduce(
    (sum, item) => sum + item.total_cost + item.base_cost_allocation, 0
  );

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
            <p className="text-xs text-muted-foreground">
              {services.filter(s => s.cost_type === 'usage_based').length} usage-based
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">Registered tenants</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Costs</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalAllocated.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Current month allocated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Google Maps API Shared Cost Allocation
              </CardTitle>
              <CardDescription>€500/month base cost split proportionally among tenants based on usage</CardDescription>
            </div>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleMapsAllocations.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground mb-2">Current Allocations:</div>
              {googleMapsAllocations.map((allocation, index) => {
                const percentage = (allocation.base_cost_allocation / 500) * 100;
                
                return (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="font-medium">Google Maps API Usage</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({percentage.toFixed(1)}% usage share)
                      </span>
                    </div>
                    <span className="text-lg font-semibold">
                      €{allocation.base_cost_allocation.toFixed(2)}
                    </span>
                  </div>
                );
              })}
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Total Allocated:</span>
                  <span>€{totalAllocated.toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Remaining: €{(500 - totalAllocated).toFixed(2)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium">No shared cost allocations found</p>
              <p className="text-sm mt-1">Calculate monthly allocations to see breakdown</p>
            </div>
          )}
          
          <Button 
            onClick={calculateSharedCosts}
            className="w-full"
            size="lg"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Current Month Shared Costs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const ServicePricingTab: React.FC<{ 
  services: ServiceCostModel[];
  editingService: string | null;
  setEditingService: (id: string | null) => void;
  updateServicePricing: (serviceId: string, unitCost: number, baseCost?: number) => void;
}> = ({ services, editingService, setEditingService, updateServicePricing }) => {

  const ServiceConfigCard: React.FC<{ service: ServiceCostModel }> = ({ service }) => {
    const [newUnitPrice, setNewUnitPrice] = useState(service.unit_cost?.toString() || '');
    const [newBasePrice, setNewBasePrice] = useState(service.base_cost_monthly?.toString() || '');

    const handleSave = () => {
      const unitCost = parseFloat(newUnitPrice) || 0;
      const baseCost = service.cost_type !== 'usage_based' ? (parseFloat(newBasePrice) || 0) : undefined;
      updateServicePricing(service.id, unitCost, baseCost);
    };

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">{service.service_name}</CardTitle>
              <CardDescription className="mt-1">
                {service.cost_type === 'fixed_monthly' && 'Fixed Monthly Cost'}
                {service.cost_type === 'usage_based' && 'Usage-Based Pricing'}
                {service.cost_type === 'shared_base' && 'Shared Base Cost + Usage'}
              </CardDescription>
            </div>
            <Badge variant={service.cost_type === 'fixed_monthly' ? 'default' : 'secondary'}>
              {service.cost_type.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Current pricing display */}
            <div className="space-y-2">
              {service.cost_type === 'fixed_monthly' && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">€{service.base_cost_monthly}</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>
              )}
              {service.cost_type === 'usage_based' && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">€{service.unit_cost}</p>
                  <p className="text-sm text-muted-foreground">per unit</p>
                </div>
              )}
              {service.cost_type === 'shared_base' && (
                <div className="text-center space-y-1">
                  <p className="text-2xl font-bold text-orange-600">€{service.base_cost_monthly}</p>
                  <p className="text-sm text-muted-foreground">/month base</p>
                  <p className="text-lg font-semibold text-orange-600">+ €{service.unit_cost}</p>
                  <p className="text-sm text-muted-foreground">per unit</p>
                </div>
              )}
            </div>

            {/* Edit pricing form */}
            {editingService === service.id ? (
              <div className="space-y-3 border-t pt-4">
                {service.cost_type !== 'fixed_monthly' && (
                  <div>
                    <Label htmlFor={`unit-${service.id}`} className="text-sm font-medium">
                      Unit Cost (€)
                    </Label>
                    <Input
                      id={`unit-${service.id}`}
                      type="number"
                      step="0.001"
                      value={newUnitPrice}
                      onChange={(e) => setNewUnitPrice(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                )}
                {service.cost_type !== 'usage_based' && (
                  <div>
                    <Label htmlFor={`base-${service.id}`} className="text-sm font-medium">
                      Base Cost (€)
                    </Label>
                    <Input
                      id={`base-${service.id}`}
                      type="number"
                      step="0.01"
                      value={newBasePrice}
                      onChange={(e) => setNewBasePrice(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="flex-1">
                    Save Changes
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setEditingService(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditingService(service.id)}
                className="w-full mt-4"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Pricing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Service Pricing Configuration</h2>
        <p className="text-muted-foreground mb-6">
          Configure pricing for individual services across all tenants
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceConfigCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
};

const TenantBillingTab: React.FC<{ 
  tenants: Tenant[];
  selectedTenant: number | null;
  setSelectedTenant: (id: number | null) => void;
  usageData: UsageData[];
  fetchTenantUsage: () => void;
}> = ({ tenants, selectedTenant, setSelectedTenant, usageData, fetchTenantUsage }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Process usage data into service summary
  const usageSummary = usageData.reduce((acc, item) => {
    if (!acc[item.service_name]) {
      acc[item.service_name] = {
        total_units: 0,
        total_cost: 0,
        base_cost_allocation: 0,
        cost_type: item.cost_type
      };
    }
    acc[item.service_name].total_units += item.units_used;
    acc[item.service_name].total_cost += item.total_cost;
    acc[item.service_name].base_cost_allocation += item.base_cost_allocation;
    return acc;
  }, {} as Record<string, any>);

  const totalCost = Object.values(usageSummary).reduce(
    (sum: number, service: any) => sum + service.total_cost + service.base_cost_allocation, 
    0
  );

  const selectedTenantData = tenants.find(t => t.tenants_id === selectedTenant);

  return (
    <div className="space-y-6">
      {/* Tenant Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Tenant for Billing Review</CardTitle>
          <CardDescription>
            Choose a tenant to view their current month billing breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="tenant-select">Tenant</Label>
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
            <Button variant="outline" onClick={fetchTenantUsage} disabled={!selectedTenant}>
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing Summary */}
      {selectedTenant && selectedTenantData && (
        <div className="grid gap-6">
          {/* Monthly Total Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <DollarSign className="w-6 h-6" />
                {selectedTenantData.name} - Monthly Billing
              </CardTitle>
              <CardDescription>
                Current month usage and costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">€{totalCost.toFixed(2)}</p>
                <p className="text-muted-foreground mt-1">Total Monthly Cost</p>
              </div>
            </CardContent>
          </Card>

          {/* Service Breakdown */}
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Service Usage Breakdown</h3>
            {Object.keys(usageSummary).length > 0 ? (
              Object.entries(usageSummary).map(([serviceName, data]) => (
                <Card key={serviceName}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{serviceName}</h4>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p>{data.total_units} units used</p>
                          <Badge variant="outline" className="text-xs">
                            {data.cost_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-xl font-bold">
                          €{(data.total_cost + data.base_cost_allocation).toFixed(2)}
                        </p>
                        {data.base_cost_allocation > 0 && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p>Usage: €{data.total_cost.toFixed(2)}</p>
                            <p>Base: €{data.base_cost_allocation.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <p>No usage data found for current month</p>
                    <p className="text-sm mt-1">Usage will appear here once services are used</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Invoice Actions */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Button className="flex-1">
                  Generate Invoice
                </Button>
                <Button variant="outline" className="flex-1">
                  Export Data
                </Button>
                <Button variant="outline" className="flex-1">
                  Send to Tenant
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const AnalyticsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Dashboard</CardTitle>
        <CardDescription>
          Usage analytics and reporting (Future Implementation)
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