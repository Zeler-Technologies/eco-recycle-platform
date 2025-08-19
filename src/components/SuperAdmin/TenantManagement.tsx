import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useTenantUsers } from '@/hooks/useTenantUsers';
import UserManagementModal from './UserManagementModal';
import { 
  Building2, 
  Users, 
  Settings, 
  CreditCard, 
  Globe, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Key,
  History,
  Car,
  Percent
} from 'lucide-react';

interface TenantManagementProps {
  onBack: () => void;
  selectedTenantId?: number | null;
}

interface Tenant {
  tenants_id: number;
  name: string;
  country: string;
  service_type: string;
  base_address: string;
  postal_code?: string;
  city?: string;
  invoice_email: string;
  created_at: string;
  status?: string;
  plan?: string;
  revenue?: string;
  users?: number;
  apiConnections?: number;
}

const TenantManagement: React.FC<TenantManagementProps> = ({ onBack, selectedTenantId }) => {
  const [selectedTenant, setSelectedTenant] = useState<number | null>(selectedTenantId || null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedScrapyardId, setSelectedScrapyardId] = useState<number | null>(null);
  const [tenantScrapyards, setTenantScrapyards] = useState<any[]>([]);
  const [scrapyardsLoading, setScrapyardsLoading] = useState(false);
  const [scrapyardError, setScrapyardError] = useState<string | null>(null);
  // Fetch users for the selected tenant
  const { data: tenantUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useTenantUsers(selectedTenant);

  // Set selected tenant when prop changes
  useEffect(() => {
    if (selectedTenantId) {
      setSelectedTenant(selectedTenantId);
    }
  }, [selectedTenantId]);

  // Fetch tenants from database
  useEffect(() => {
    fetchTenants();
  }, []);

  // Fetch scrapyards for selected tenant
  const fetchTenantScrapyards = async (tenantId: number) => {
    try {
      setScrapyardsLoading(true);
      const { data, error } = await supabase
        .from('scrapyards')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setTenantScrapyards(data || []);
      
      // Select primary scrapyard (first created) by default
      if (data && data.length > 0) {
        setSelectedScrapyardId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching scrapyards:', error);
      toast.error('Failed to load scrapyard locations');
    } finally {
      setScrapyardsLoading(false);
    }
};

  // New: fetch tenant and ensure at least one scrapyard exists
  const fetchTenantWithScrapyards = async (tenantId: number) => {
    try {
      setScrapyardsLoading(true);
      setScrapyardError(null);

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('tenants_id', tenantId)
        .maybeSingle();

      if (tenantError) throw tenantError;
      if (!tenantData) {
        setScrapyardError('Tenant not found.');
        return;
      }

      const { data: scrapyardsInitial, error: scrapyardsError } = await supabase
        .from('scrapyards')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

      if (scrapyardsError) throw scrapyardsError;

      let scrapyardsData = scrapyardsInitial || [];

      if (!scrapyardsData || scrapyardsData.length === 0) {
        console.log(`Creating missing scrapyard for tenant ${tenantId}`);
        const { data: newScrapyard, error: createError } = await supabase
          .from('scrapyards')
          .insert({
            name: tenantData.name,
            address: tenantData.base_address || '',
            postal_code: '',
            city: '',
            tenant_id: tenantId,
            is_active: true
          })
          .select()
          .maybeSingle();

        if (createError) {
          console.error('Error creating scrapyard:', createError);
          setScrapyardError('Failed to create scrapyard record');
          toast.error('Failed to create scrapyard record');
          return; // Do not proceed with empty scrapyard list
        } else if (newScrapyard) {
          scrapyardsData = [newScrapyard];
          toast.success('Created missing scrapyard record');
        }
      }

      setTenantScrapyards(scrapyardsData);

      if (scrapyardsData.length > 0) {
        const primaryScrapyard = scrapyardsData[0];
        setSelectedScrapyardId(primaryScrapyard.id);

        setFormData((prev: any) => ({
          ...prev,
          address: primaryScrapyard.address || '',
          postalCode: primaryScrapyard.postal_code || '',
          city: primaryScrapyard.city || '',
          companyName: tenantData.name || '',
          country: tenantData.country || '',
          serviceType: tenantData.service_type || '',
          invoiceEmail: tenantData.invoice_email || '',
          createdAt: tenantData.created_at
        }));
      }
    } catch (error) {
      console.error('Error fetching tenant with scrapyards:', error);
      setScrapyardError('Failed to load tenant details');
      toast.error('Failed to load tenant details');
    } finally {
      setScrapyardsLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include default values for UI
      const transformedTenants = data.map(tenant => ({
        ...tenant,
        status: 'Active', // Default status
        plan: 'Premium', // Default plan
        revenue: '€0', // Default revenue
        users: 0, // Default users count
        apiConnections: 0 // Default API connections
      }));

      setTenants(transformedTenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setError('Failed to load tenants');
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for users per tenant
  const getMockUsers = (tenantId: string) => {
    const usersByTenant = {
      '1': [
        { id: '1', name: 'Lars Andersson', email: 'lars@pantabilen.se', role: 'Admin', status: 'Active' },
        { id: '2', name: 'Anna Svensson', email: 'anna@pantabilen.se', role: 'Operator', status: 'Active' },
        { id: '3', name: 'Mikael Johansson', email: 'mikael@pantabilen.se', role: 'Viewer', status: 'Inactive' }
      ],
      '2': [
        { id: '4', name: 'Erik Hansen', email: 'erik@osloscrap.no', role: 'Admin', status: 'Active' },
        { id: '5', name: 'Astrid Olsen', email: 'astrid@osloscrap.no', role: 'Operator', status: 'Active' }
      ],
      '3': [
        { id: '6', name: 'Niels Petersen', email: 'niels@copenhagenmetal.dk', role: 'Admin', status: 'Active' },
        { id: '7', name: 'Mette Hansen', email: 'mette@copenhagenmetal.dk', role: 'Operator', status: 'Active' },
        { id: '8', name: 'Kasper Nielsen', email: 'kasper@copenhagenmetal.dk', role: 'Viewer', status: 'Active' }
      ]
    };
    return usersByTenant[tenantId] || [];
  };

  // Mock data for API services per tenant
  const getMockApiServices = (tenantId: string) => {
    const servicesByTenant = {
      '1': [
        { name: 'Stripe', category: 'Payment', status: 'Connected', lastSync: '2 hours ago' },
        { name: 'Google Maps', category: 'Maps', status: 'Connected', lastSync: '5 minutes ago' },
        { name: 'Twilio SMS', category: 'Messaging', status: 'Connected', lastSync: '1 hour ago' },
        { name: 'SendGrid', category: 'Email', status: 'Connected', lastSync: '30 minutes ago' }
      ],
      '2': [
        { name: 'Stripe', category: 'Payment', status: 'Connected', lastSync: '1 hour ago' },
        { name: 'Google Maps', category: 'Maps', status: 'Error', lastSync: '2 days ago' },
        { name: 'Twilio SMS', category: 'Messaging', status: 'Connected', lastSync: '3 hours ago' }
      ],
      '3': [
        { name: 'Stripe', category: 'Payment', status: 'Connected', lastSync: '30 minutes ago' },
        { name: 'Google Maps', category: 'Maps', status: 'Connected', lastSync: '10 minutes ago' },
        { name: 'Twilio SMS', category: 'Messaging', status: 'Error', lastSync: '1 day ago' },
        { name: 'SendGrid', category: 'Email', status: 'Connected', lastSync: '45 minutes ago' },
        { name: 'BankID', category: 'Identity', status: 'Connected', lastSync: '2 hours ago' }
      ]
    };
    return servicesByTenant[tenantId] || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-status-completed text-white';
      case 'Pending': return 'bg-status-processing text-white';
      case 'Suspended': return 'bg-status-cancelled text-white';
      case 'Connected': return 'bg-status-completed text-white';
      case 'Error': return 'bg-status-cancelled text-white';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Connected':
        return <Check className="h-3 w-3" />;
      case 'Error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const isAddressValid = () => {
    return !!(formData.address && formData.postalCode && formData.city);
  };

  const getAddressStatus = () => {
    return isAddressValid() ? 'Complete' : 'Incomplete';
  };

  const getAddressStatusColor = () => {
    return isAddressValid() ? 'bg-status-completed text-white' : 'bg-status-cancelled text-white';
  };

  const selectedTenantData = tenants.find(t => t.tenants_id === selectedTenant);
  const selectedScrapyard = tenantScrapyards.find(s => s.id === selectedScrapyardId);

  // Fetch scrapyards when tenant selection changes
  useEffect(() => {
    if (selectedTenant) {
      fetchTenantWithScrapyards(selectedTenant);
    } else {
      setTenantScrapyards([]);
      setSelectedScrapyardId(null);
    }
  }, [selectedTenant]);

  // Update form data when selected tenant or scrapyard changes
  useEffect(() => {
    if (selectedTenantData) {
      setFormData({
        companyName: selectedTenantData.name,
        country: selectedTenantData.country,
        serviceType: selectedTenantData.service_type,
        address: selectedScrapyard?.address || '',
        postalCode: selectedScrapyard?.postal_code || '',
        city: selectedScrapyard?.city || '',
        invoiceEmail: selectedTenantData.invoice_email,
        plan: selectedTenantData.plan?.toLowerCase() || 'premium',
        monthlyRevenue: selectedTenantData.revenue || '€0',
        createdAt: selectedTenantData.created_at
      });
    } else {
      // Reset form data when no tenant is selected
      setFormData({});
    }
  }, [selectedTenantData, selectedScrapyard]);

  const handleSelectTenant = (tenantId: number) => {
    setSelectedTenant(tenantId);
    setEditingSection(null); // Reset editing state when selecting new tenant
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update the tenant data in the tenants array for real-time reflection
    if (selectedTenant && field === 'plan') {
      const tenantIndex = tenants.findIndex(t => t.tenants_id === selectedTenant);
      if (tenantIndex !== -1) {
        const updatedTenants = [...tenants];
        updatedTenants[tenantIndex].plan = value.charAt(0).toUpperCase() + value.slice(1);
        setTenants(updatedTenants);
      }
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleUserModalSuccess = () => {
    refetchUsers();
    toast.success('User management completed successfully');
  };

  const handleSaveChanges = async () => {
    if (!selectedTenant || !formData) return;

    // Address updates with validation and existence checks
    if (editingSection === 'address') {
      if (!isAddressValid()) {
        toast.error('Please fill in all required address fields');
        return;
      }

      // Prepare normalized values
      const address = (formData.address || '').trim();
      const postalCode = (formData.postalCode || '').trim();
      const city = (formData.city || '').trim();

      // Ensure there is a scrapyard to update; create one if missing
      let ensureScrapyardId = selectedScrapyardId;

      if (!ensureScrapyardId) {
        const { data: created, error: createErr } = await supabase
          .from('scrapyards')
          .insert({
            name: formData.companyName || 'Primary Location',
            address,
            postal_code: postalCode,
            city,
            tenant_id: selectedTenant,
            is_active: true,
          })
          .select('id')
          .maybeSingle();

        if (createErr || !created) {
          toast.error('Could not create a scrapyard record. Updating company address only.');
        } else {
          ensureScrapyardId = created.id;
          setSelectedScrapyardId(created.id);
        }
      }

      if (ensureScrapyardId) {
        const { data: scrapyardCheck, error: checkError } = await supabase
          .from('scrapyards')
          .select('id')
          .eq('id', ensureScrapyardId)
          .maybeSingle();

        if (checkError || !scrapyardCheck) {
          // Try to recreate if it was deleted
          const { data: recreated, error: recreateErr } = await supabase
            .from('scrapyards')
            .insert({
              name: formData.companyName || 'Primary Location',
              address,
              postal_code: postalCode,
              city,
              tenant_id: selectedTenant,
              is_active: true,
            })
            .select('id')
            .maybeSingle();

          if (recreateErr || !recreated) {
            toast.error('Scrapyard not available. Updating company address only.');
            ensureScrapyardId = null;
          } else {
            ensureScrapyardId = recreated.id;
            setSelectedScrapyardId(recreated.id);
          }
        }
      }

      try {
        // We already normalized these values above
        const address = (formData.address || '').trim();
        const postalCode = (formData.postalCode || '').trim();
        const city = (formData.city || '').trim();

        if (ensureScrapyardId) {
          const { error: scrapyardError } = await supabase
            .from('scrapyards')
            .update({
              address,
              postal_code: postalCode,
              city,
              updated_at: new Date().toISOString(),
            })
            .eq('id', ensureScrapyardId);

          if (scrapyardError) throw scrapyardError;
        }

        const fullAddress = `${address}, ${postalCode} ${city}`;
        const { error: tenantError } = await supabase
          .from('tenants')
          .update({
            base_address: fullAddress,
            updated_at: new Date().toISOString()
          })
          .eq('tenants_id', selectedTenant);

        if (tenantError) throw tenantError;

        toast.success('Address updated successfully');
        setEditingSection(null);

        await fetchTenantWithScrapyards(selectedTenant);
      } catch (error) {
        console.error('Error updating address:', error);
        toast.error('Failed to update address');
      }
      return;
    }

    // Non-address updates
    try {
      const tenantUpdateData: any = {};
      if (formData.companyName) tenantUpdateData.name = formData.companyName;
      if (formData.country) tenantUpdateData.country = formData.country;
      if (formData.serviceType) tenantUpdateData.service_type = formData.serviceType;
      if (formData.invoiceEmail) tenantUpdateData.invoice_email = formData.invoiceEmail;

      if (Object.keys(tenantUpdateData).length > 0) {
        const { error: tenantError } = await supabase
          .from('tenants')
          .update(tenantUpdateData)
          .eq('tenants_id', selectedTenant);

        if (tenantError) throw tenantError;
      }

      setTenants(prevTenants => 
        prevTenants.map(tenant => 
          tenant.tenants_id === selectedTenant 
            ? { ...tenant, ...tenantUpdateData }
            : tenant
        )
      );

      setEditingSection(null);
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    }
  };

  return (
    <div className="theme-admin min-h-screen bg-admin-muted">
      <header className="bg-admin-primary text-admin-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-admin-primary-foreground hover:text-admin-primary-foreground/80 transition-colors"
              >
                <Building2 className="h-6 w-6" />
                <span>← Back to Dashboard</span>
              </button>
            </div>
            <div>
              <h1 className="text-xl font-semibold">Tenant Management</h1>
              <p className="text-sm text-admin-primary-foreground/80">Configure and manage tenant settings</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tenant List */}
          <Card className="bg-white shadow-custom-sm">
            <CardHeader>
              <CardTitle className="text-admin-primary flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                All Tenants
              </CardTitle>
              <CardDescription>Select a tenant to manage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-4">Loading tenants...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">{error}</div>
              ) : tenants.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No tenants found</div>
              ) : (
                tenants.map((tenant) => (
                  <div
                    key={tenant.tenants_id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTenant === tenant.tenants_id 
                        ? 'border-admin-primary bg-admin-accent/30' 
                        : 'hover:bg-admin-accent/10'
                    }`}
                    onClick={() => handleSelectTenant(tenant.tenants_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{tenant.name}</h4>
                        <p className="text-xs text-muted-foreground">{tenant.country} • {tenant.service_type || 'Service'}</p>
                      </div>
                      <Badge className={getStatusColor(tenant.status || 'Active')}>
                        {getStatusIcon(tenant.status || 'Active')}
                        {tenant.status || 'Active'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {tenant.base_address || 'No address'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {tenant.invoice_email}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Tenant Details */}
          <div className="lg:col-span-2">
            {selectedTenantData ? (
              <Tabs defaultValue="info" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5 bg-admin-primary">
                  <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Info</TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Users</TabsTrigger>
                  <TabsTrigger value="api" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">API</TabsTrigger>
                  <TabsTrigger value="billing" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Billing</TabsTrigger>
                  <TabsTrigger value="config" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Config</TabsTrigger>
                </TabsList>

                {/* Tenant Information Tab */}
                <TabsContent value="info">
                  <Card className="bg-white shadow-custom-sm">
                    <CardHeader>
                      <CardTitle className="text-admin-primary">Tenant Information</CardTitle>
                      <CardDescription>Manage basic tenant details and contact information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Company Information */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Company Information
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSection(editingSection === 'company' ? null : 'company')}
                          >
                            {editingSection === 'company' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                              id="companyName"
                              value={formData.companyName || ''}
                              onChange={(e) => handleInputChange('companyName', e.target.value)}
                              disabled={editingSection !== 'company'}
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={formData.country || ''}
                              onChange={(e) => handleInputChange('country', e.target.value)}
                              disabled={editingSection !== 'company'}
                            />
                          </div>
                          <div>
                            <Label htmlFor="serviceType">Service Type</Label>
                            <Input
                              id="serviceType"
                              value={formData.serviceType || ''}
                              onChange={(e) => handleInputChange('serviceType', e.target.value)}
                              disabled={editingSection !== 'company'}
                            />
                          </div>
                          <div>
                            <Label htmlFor="createdAt">Created Date</Label>
                            <Input
                              id="createdAt"
                              value={formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : ''}
                              disabled={true}
                              className="bg-muted"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Address Information */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Scrapyard Locations
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSection(editingSection === 'address' ? null : 'address')}
                          >
                            {editingSection === 'address' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>

                        {scrapyardError && (
                          <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Scrapyard Data Issue</AlertTitle>
                            <AlertDescription>
                              {scrapyardError}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="ml-2"
                                onClick={() => selectedTenant && fetchTenantWithScrapyards(selectedTenant)}
                              >
                                Retry
                              </Button>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Scrapyard Selector */}
                        <div className="space-y-3">
                          <Label htmlFor="scrapyardSelect">Select Scrapyard Location</Label>
                          {scrapyardsLoading ? (
                            <div className="text-sm text-muted-foreground">Loading scrapyards...</div>
                          ) : tenantScrapyards.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No scrapyard locations found</div>
                          ) : (
                            <Select
                              value={selectedScrapyardId?.toString() || ''}
                              onValueChange={(value) => setSelectedScrapyardId(parseInt(value))}
                              disabled={editingSection !== 'address'}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a scrapyard location" />
                              </SelectTrigger>
                              <SelectContent>
                                {tenantScrapyards.map((scrapyard, index) => {
                                  const addressComplete = !!(scrapyard.address && scrapyard.postal_code && scrapyard.city);
                                  return (
                                    <SelectItem key={scrapyard.id} value={scrapyard.id.toString()}>
                                      <div className="flex items-center gap-2 w-full">
                                        <MapPin className="h-4 w-4" />
                                        <span>{scrapyard.name || `Location ${index + 1}`}</span>
                                        {index === 0 && <Badge variant="secondary">Primary</Badge>}
                                        <Badge 
                                          className={addressComplete 
                                            ? 'bg-status-completed text-white' 
                                            : 'bg-status-cancelled text-white'}
                                        >
                                          {addressComplete ? 'Complete' : 'Incomplete'}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={editingSection !== 'address'}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Scrapyard Location
                          </Button>
                        </div>

                        {/* Address Form */}
                        {selectedScrapyardId && (
                          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Address Details</h5>
                              <Badge className={getAddressStatusColor()}>
                                {getAddressStatus()}
                              </Badge>
                            </div>
                            
                            <div className="grid gap-4">
                              <div>
                                <Label htmlFor="address" className="flex items-center gap-1">
                                  Street Address <span className="text-red-500">*</span>
                                  <span className="text-xs text-muted-foreground">(Required)</span>
                                </Label>
                                <Input
                                  id="address"
                                  value={formData.address || ''}
                                  onChange={(e) => handleInputChange('address', e.target.value)}
                                  disabled={editingSection !== 'address'}
                                  placeholder="Enter street address"
                                  className={!formData.address && editingSection === 'address' ? 'border-red-500' : ''}
                                />
                                {!formData.address && editingSection === 'address' && (
                                  <p className="text-xs text-red-500 mt-1">Street address is required</p>
                                )}
                              </div>
                              
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label htmlFor="postalCode" className="flex items-center gap-1">
                                    Postal Code <span className="text-red-500">*</span>
                                    <span className="text-xs text-muted-foreground">(Required)</span>
                                  </Label>
                                  <Input
                                    id="postalCode"
                                    value={formData.postalCode || ''}
                                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                                    disabled={editingSection !== 'address'}
                                    placeholder="Enter postal code"
                                    className={!formData.postalCode && editingSection === 'address' ? 'border-red-500' : ''}
                                  />
                                  {!formData.postalCode && editingSection === 'address' && (
                                    <p className="text-xs text-red-500 mt-1">Postal code is required</p>
                                  )}
                                </div>
                                <div>
                                  <Label htmlFor="city" className="flex items-center gap-1">
                                    City <span className="text-red-500">*</span>
                                    <span className="text-xs text-muted-foreground">(Required)</span>
                                  </Label>
                                  <Input
                                    id="city"
                                    value={formData.city || ''}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    disabled={editingSection !== 'address'}
                                    placeholder="Enter city"
                                    className={!formData.city && editingSection === 'address' ? 'border-red-500' : ''}
                                  />
                                  {!formData.city && editingSection === 'address' && (
                                    <p className="text-xs text-red-500 mt-1">City is required</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {!selectedScrapyardId && tenantScrapyards.length > 0 && (
                          <div className="p-4 border rounded-lg bg-muted/10 text-center">
                            <p className="text-sm text-muted-foreground">Select a scrapyard location to edit address details</p>
                          </div>
                        )}

                        <div>
                          <Label htmlFor="invoiceEmail">Invoice Email</Label>
                          <Input
                            id="invoiceEmail"
                            type="email"
                            value={formData.invoiceEmail || ''}
                            onChange={(e) => handleInputChange('invoiceEmail', e.target.value)}
                            disabled={editingSection !== 'address'}
                            placeholder="Enter invoice email"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch disabled={editingSection !== 'address'} />
                          <Label>Use different billing address</Label>
                        </div>
                      </div>

                      <Separator />

                       {/* Plan Information */}
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <h4 className="font-semibold flex items-center gap-2">
                             <CreditCard className="h-4 w-4" />
                             Plan Information
                           </h4>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setEditingSection(editingSection === 'plan' ? null : 'plan')}
                           >
                             {editingSection === 'plan' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                           </Button>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <Label htmlFor="plan">Current Plan</Label>
                             <Select
                               value={formData.plan || 'premium'}
                               onValueChange={(value) => handleInputChange('plan', value)}
                               disabled={editingSection !== 'plan'}
                             >
                               <SelectTrigger>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="starter">Starter</SelectItem>
                                 <SelectItem value="premium">Premium</SelectItem>
                                 <SelectItem value="enterprise">Enterprise</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div>
                             <Label htmlFor="monthlyRevenue">Monthly Revenue</Label>
                             <Input
                               id="monthlyRevenue"
                               value={formData.monthlyRevenue || ''}
                               onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
                               disabled={editingSection !== 'plan'}
                             />
                           </div>
                         </div>
                       </div>

                      {editingSection && (
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSaveChanges}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditingSection(null)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* User Management Tab */}
                <TabsContent value="users">
                  <Card className="bg-white shadow-custom-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-admin-primary">User Management</CardTitle>
                          <CardDescription>Manage users and their access rights</CardDescription>
                        </div>
                        <Button size="sm" onClick={handleAddUser}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </div>
                    </CardHeader>
                     <CardContent>
                       {usersLoading ? (
                         <div className="flex justify-center py-8">
                           <div className="text-muted-foreground">Loading users...</div>
                         </div>
                       ) : !selectedTenant ? (
                         <div className="text-center py-8">
                           <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                           <p className="text-muted-foreground">Please select a tenant to view users</p>
                         </div>
                       ) : tenantUsers.length === 0 ? (
                         <div className="text-center py-8">
                           <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                           <p className="text-muted-foreground">No users found for this tenant</p>
                           <p className="text-sm text-muted-foreground mt-2">
                             Tenant ID: {selectedTenant} | 
                             Tenant: {tenants.find(t => t.tenants_id === selectedTenant)?.name || 'Unknown'}
                           </p>
                           <p className="text-xs text-muted-foreground mt-1">
                             Users must have tenant_id = {selectedTenant} in auth_users table
                           </p>
                         </div>
                       ) : (
                         <div className="space-y-4">
                           {tenantUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-admin-accent rounded-full">
                                  <Users className="h-4 w-4 text-admin-primary" />
                                </div>
                                 <div>
                                   <h4 className="font-semibold">
                                     {user.first_name || user.last_name 
                                       ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                       : user.email
                                     }
                                   </h4>
                                   <p className="text-sm text-muted-foreground">{user.email}</p>
                                   <p className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                                      {user.role}
                                    </Badge>
                                    <Badge variant="outline">
                                      {new Date(user.created_at).toLocaleDateString()}
                                    </Badge>
                                    {user.pnr_num && (
                                      <Badge variant="secondary">
                                        PNR: {user.pnr_num}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                               <div className="flex items-center gap-2">
                                 <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                   <Edit className="h-3 w-3" />
                                 </Button>
                                 <Button variant="outline" size="sm" className="text-red-600">
                                   <Trash2 className="h-3 w-3" />
                                 </Button>
                               </div>
                            </div>
                          ))}
                        </div>
                       )}
                     </CardContent>
                  </Card>
                </TabsContent>

                {/* API Integrations Tab */}
                <TabsContent value="api">
                  <Card className="bg-white shadow-custom-sm">
                    <CardHeader>
                      <CardTitle className="text-admin-primary">API Integrations</CardTitle>
                      <CardDescription>Configure tenant-specific API connections</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-4">
                         {getMockApiServices(selectedTenant?.toString() || '').map((service, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-admin-accent rounded-full">
                                <Globe className="h-4 w-4 text-admin-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{service.name}</h4>
                                <p className="text-sm text-muted-foreground">{service.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <Badge className={getStatusColor(service.status)}>
                                  {getStatusIcon(service.status)}
                                  {service.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">Last sync: {service.lastSync}</p>
                              </div>
                              <Button variant="outline" size="sm">
                                <Settings className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Billing Settings Tab */}
                <TabsContent value="billing">
                  <div className="space-y-6">
                    {/* Pricing Model Selection */}
                    <Card className="bg-white shadow-custom-sm">
                      <CardHeader>
                        <CardTitle className="text-admin-primary flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Pricing Model Configuration
                        </CardTitle>
                        <CardDescription>Select and configure the pricing model for this tenant</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                          {['starter', 'premium', 'enterprise'].map((tier) => (
                            <div
                              key={tier}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                formData.plan === tier 
                                  ? 'border-admin-primary bg-admin-accent/30' 
                                  : 'border-gray-200 hover:border-admin-primary/50'
                              }`}
                              onClick={() => handleInputChange('plan', tier)}
                            >
                              <div className="text-center">
                                <h4 className="font-semibold capitalize">{tier}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {tier === 'starter' && 'Basic features, up to 500 SMS/month'}
                                  {tier === 'premium' && 'Enhanced features, up to 2000 SMS/month'}
                                  {tier === 'enterprise' && 'Full features, up to 10000 SMS/month'}
                                </p>
                                <div className="mt-2 font-bold text-admin-primary">
                                  €{tier === 'starter' ? '49' : tier === 'premium' ? '149' : '399'}/month
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="invoiceEmail">Invoice Email</Label>
                            <Input 
                              id="invoiceEmail" 
                              value={formData.invoiceEmail || ''}
                              onChange={(e) => handleInputChange('invoiceEmail', e.target.value)}
                              placeholder="billing@company.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="monthlyRevenue">Current Monthly Revenue</Label>
                            <Input 
                              id="monthlyRevenue" 
                              value={formData.monthlyRevenue || ''}
                              onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
                              disabled
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Service Pricing Matrix */}
                    <Card className="bg-white shadow-custom-sm">
                      <CardHeader>
                        <CardTitle className="text-admin-primary flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Service Pricing Matrix
                        </CardTitle>
                        <CardDescription>Configure pricing for individual services</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Platform Base Service */}
                          <div className="p-4 bg-admin-accent/10 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-admin-primary/10 rounded-full">
                                  <Globe className="h-4 w-4 text-admin-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">Platform Base Service</h4>
                                  <p className="text-sm text-muted-foreground">Monthly platform access</p>
                                </div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-muted-foreground">Internal Cost</Label>
                                <p className="font-medium">€29.00</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Markup</Label>
                                <p className="font-medium">20%</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Final Price</Label>
                                <p className="font-medium">€34.80</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Margin</Label>
                                <p className="font-medium text-admin-primary">16.7%</p>
                              </div>
                            </div>
                          </div>

                          {/* SMS Services */}
                          <div className="p-4 bg-admin-accent/10 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-admin-primary/10 rounded-full">
                                  <Phone className="h-4 w-4 text-admin-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">SMS Services</h4>
                                  <p className="text-sm text-muted-foreground">Per SMS sent</p>
                                </div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-muted-foreground">Internal Cost</Label>
                                <p className="font-medium">€0.08</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Markup</Label>
                                <p className="font-medium">40%</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Final Price</Label>
                                <p className="font-medium">€0.112</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Margin</Label>
                                <p className="font-medium text-admin-primary">28.6%</p>
                              </div>
                            </div>
                          </div>

                          {/* Car Processing */}
                          <div className="p-4 bg-admin-accent/10 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-admin-primary/10 rounded-full">
                                  <Car className="h-4 w-4 text-admin-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">Car Processing</h4>
                                  <p className="text-sm text-muted-foreground">Per vehicle processed</p>
                                </div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-muted-foreground">Internal Cost</Label>
                                <p className="font-medium">€0.12</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Markup</Label>
                                <p className="font-medium">25%</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Final Price</Label>
                                <p className="font-medium">€0.15</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Margin</Label>
                                <p className="font-medium text-admin-primary">20%</p>
                              </div>
                            </div>
                          </div>

                          {/* Google Maps API */}
                          <div className="p-4 bg-admin-accent/10 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-admin-primary/10 rounded-full">
                                  <MapPin className="h-4 w-4 text-admin-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">Google Maps API</h4>
                                  <p className="text-sm text-muted-foreground">Per API request</p>
                                </div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-muted-foreground">Internal Cost</Label>
                                <p className="font-medium">€0.005</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Markup</Label>
                                <p className="font-medium">300%</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Final Price</Label>
                                <p className="font-medium">€0.020</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Margin</Label>
                                <p className="font-medium text-admin-primary">75%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* VAT Configuration */}
                    <Card className="bg-white shadow-custom-sm">
                      <CardHeader>
                        <CardTitle className="text-admin-primary flex items-center gap-2">
                          <Percent className="h-5 w-5" />
                          VAT Configuration
                        </CardTitle>
                        <CardDescription>Configure VAT settings for this tenant</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="defaultVAT">Default VAT Rate (%)</Label>
                            <Input 
                              id="defaultVAT" 
                              type="number" 
                              defaultValue="25" 
                              min="0" 
                              max="50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="vatCountry">VAT Country</Label>
                            <Select defaultValue="sweden">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sweden">Sweden (25%)</SelectItem>
                                <SelectItem value="norway">Norway (25%)</SelectItem>
                                <SelectItem value="denmark">Denmark (25%)</SelectItem>
                                <SelectItem value="finland">Finland (24%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label>Service-specific VAT Rates</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 bg-admin-accent/10 rounded-lg">
                              <span className="text-sm">Platform Service</span>
                              <Input className="w-20" type="number" defaultValue="25" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-admin-accent/10 rounded-lg">
                              <span className="text-sm">SMS Services</span>
                              <Input className="w-20" type="number" defaultValue="25" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-admin-accent/10 rounded-lg">
                              <span className="text-sm">Car Processing</span>
                              <Input className="w-20" type="number" defaultValue="25" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-admin-accent/10 rounded-lg">
                              <span className="text-sm">Google Maps</span>
                              <Input className="w-20" type="number" defaultValue="25" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch />
                          <Label>VAT Exempt Tenant</Label>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Billing Overview */}
                    <Card className="bg-white shadow-custom-sm">
                      <CardHeader>
                        <CardTitle className="text-admin-primary flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Billing Overview
                        </CardTitle>
                        <CardDescription>Current billing configuration and estimated costs</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <Label className="text-sm font-medium">Active Pricing Model</Label>
                              <div className="mt-2 p-3 bg-admin-accent/10 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-admin-primary text-white capitalize">
                                    {formData.plan || 'Premium'}
                                  </Badge>
                                  <span className="text-sm">€{formData.plan === 'starter' ? '49' : formData.plan === 'enterprise' ? '399' : '149'}/month</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Monthly Estimate</Label>
                              <div className="mt-2 p-3 bg-admin-accent/10 rounded-lg">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>Base Fee:</span>
                                    <span>€{formData.plan === 'starter' ? '49.00' : formData.plan === 'enterprise' ? '399.00' : '149.00'}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Usage (est.):</span>
                                    <span>€85.50</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>VAT (25%):</span>
                                    <span>€{((parseFloat(formData.plan === 'starter' ? '49' : formData.plan === 'enterprise' ? '399' : '149') + 85.50) * 0.25).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-bold border-t pt-1">
                                    <span>Total:</span>
                                    <span>€{((parseFloat(formData.plan === 'starter' ? '49' : formData.plan === 'enterprise' ? '399' : '149') + 85.50) * 1.25).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Service Usage Summary</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex justify-between items-center p-2 bg-admin-accent/10 rounded text-sm">
                                <span>SMS Services (1,250 sent)</span>
                                <span>€175.00 (incl. VAT)</span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-admin-accent/10 rounded text-sm">
                                <span>Car Processing (320 vehicles)</span>
                                <span>€60.00 (incl. VAT)</span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-admin-accent/10 rounded text-sm">
                                <span>Google Maps API (2,150 requests)</span>
                                <span>€53.75 (incl. VAT)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Save Actions */}
                    <div className="flex gap-2">
                      <Button className="bg-admin-primary hover:bg-admin-primary/90">
                        <Save className="h-4 w-4 mr-2" />
                        Save Billing Configuration
                      </Button>
                      <Button variant="outline">
                        <History className="h-4 w-4 mr-2" />
                        View Change History
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Configuration Tab */}
                <TabsContent value="config">
                  <Card className="bg-white shadow-custom-sm">
                    <CardHeader>
                      <CardTitle className="text-admin-primary">Configuration</CardTitle>
                      <CardDescription>Additional tenant settings and preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Service Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications for service updates</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>API Rate Limiting</Label>
                            <p className="text-sm text-muted-foreground">Apply rate limits to API requests</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Data Retention</Label>
                            <p className="text-sm text-muted-foreground">Extended data retention period</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label htmlFor="notes">Internal Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add internal notes or metadata for this tenant..."
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline">
                          <History className="h-4 w-4 mr-2" />
                          View Audit Log
                        </Button>
                        <Button>
                          <Save className="h-4 w-4 mr-2" />
                          Save Configuration
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="bg-white shadow-custom-sm">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a Tenant</h3>
                    <p className="text-muted-foreground">Choose a tenant from the list to view and manage their settings</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* User Management Modal */}
      {selectedTenant && (
        <UserManagementModal
          isOpen={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          user={selectedUser}
          tenantId={selectedTenant}
          tenantName={selectedTenantData?.name || 'Unknown Tenant'}
          onSuccess={handleUserModalSuccess}
        />
      )}
    </div>
  );
};

export default TenantManagement;