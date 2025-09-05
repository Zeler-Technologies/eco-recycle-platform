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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="tenants">Per Tenant</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
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

        <TabsContent value="usage" className="space-y-6">
          <UsageTrackingTab tenants={tenants} services={services} />
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
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      
      const { data: usageData } = await supabase
        .from('tenant_service_usage')
        .select('*')
        .gte('usage_date', startDate)
        .lte('usage_date', endDate);
      
      const googleMapsUsage = usageData?.filter((item: any) => 
        item.service_name?.includes('google_maps') && item.base_cost_allocation > 0
      ) || [];
      
      setSharedCosts(googleMapsUsage);
    } catch (error) {
      console.error('Error fetching shared costs:', error);
    }
  };

  const fetchRevenueSummary = async () => {
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      
      const { data } = await supabase
        .from('tenant_service_usage')
        .select('total_cost')
        .gte('usage_date', startDate)
        .lte('usage_date', endDate);
      
      const total = data?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;
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
      const { error } = await supabase
        .from('service_cost_models' as any)
        .update(editValues)
        .eq('id', serviceId);
      
      if (error) throw error;
      
      setEditingService(null);
      onRefresh();
      
      toast({
        title: "Success",
        description: "Service pricing updated successfully",
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
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      
      const { data } = await supabase
        .from('tenant_service_usage')
        .select('*')
        .eq('tenant_id', selectedTenant)
        .gte('usage_date', startDate)
        .lte('usage_date', endDate);
      
      const serviceBreakdown = (data || []).reduce((acc: any, item: any) => {
        const serviceName = item.service_name || 'Unknown Service';
        if (!acc[serviceName]) {
          acc[serviceName] = {
            total_units: 0,
            total_cost: 0,
            cost_type: 'usage_based'
          };
        }
        acc[serviceName].total_units += item.units_used || 0;
        acc[serviceName].total_cost += item.total_cost || 0;
        return acc;
      }, {});
      
      setBillingData({
        raw_data: data,
        service_breakdown: serviceBreakdown,
        total_cost: Object.values(serviceBreakdown).reduce((sum: number, service: any) => sum + service.total_cost, 0)
      });
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
            <div className="grid gap-4">
              {Object.entries(billingData.service_breakdown).map(([serviceName, service]: [string, any]) => (
                <Card key={serviceName}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{serviceName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service.total_units} units • {service.cost_type}
                        </p>
                      </div>
                      <span className="text-xl font-semibold">
                        €{service.total_cost.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total Monthly Cost:</span>
                <span>€{billingData.total_cost.toFixed(2)}</span>
              </div>
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

const UsageTrackingTab: React.FC<{ tenants: Tenant[]; services: ServiceCostModel[] }> = ({ tenants, services }) => {
  const [formData, setFormData] = useState({
    tenant_id: '',
    service_name: '',
    units_used: '',
    metadata: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('tenant_service_usage')
        .insert({
          tenant_id: parseInt(formData.tenant_id),
          service_name: formData.service_name,
          units_used: parseFloat(formData.units_used),
          usage_date: new Date().toISOString().split('T')[0],
          unit_cost: 0,
          total_cost: 0,
          base_cost_allocation: 0,
          metadata: formData.metadata ? JSON.parse(formData.metadata) : {}
        });

      if (error) throw error;

      setFormData({ tenant_id: '', service_name: '', units_used: '', metadata: '' });
      toast({
        title: "Success",
        description: "Usage recorded successfully!",
      });
    } catch (error) {
      console.error('Error recording usage:', error);
      toast({
        title: "Error",
        description: "Error recording usage",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Usage Recording</CardTitle>
        <CardDescription>Record service usage for billing purposes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tenant</Label>
              <Select value={formData.tenant_id} onValueChange={(value) => setFormData({...formData, tenant_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.tenants_id} value={tenant.tenants_id.toString()}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Service</Label>
              <Select value={formData.service_name} onValueChange={(value) => setFormData({...formData, service_name: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.service_name}>
                      {service.service_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Units Used</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.units_used}
              onChange={(e) => setFormData({...formData, units_used: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label>Metadata (JSON)</Label>
            <Textarea
              value={formData.metadata}
              onChange={(e) => setFormData({...formData, metadata: e.target.value})}
              placeholder='{"description": "Manual entry", "source": "admin"}'
              rows={3}
            />
          </div>
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Recording...' : 'Record Usage'}
          </Button>
        </form>
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
        <p className="text-muted-foreground">
          Start recording usage to see analytics and trends.
        </p>
      </CardContent>
    </Card>
  );
};

export default BillingDashboard;