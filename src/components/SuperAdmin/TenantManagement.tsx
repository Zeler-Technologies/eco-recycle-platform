import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
}

const TenantManagement: React.FC<TenantManagementProps> = ({ onBack }) => {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Mock data for tenants
  const tenants = [
    { 
      id: '1', 
      name: 'Panta Bilen Stockholm', 
      status: 'Active', 
      plan: 'Premium', 
      revenue: '€2,450',
      orgNumber: '556123-4567',
      vatNumber: 'SE556123456701',
      address: 'Storgatan 1, 111 22 Stockholm, Sweden',
      adminName: 'Lars Andersson',
      adminEmail: 'lars@pantabilen.se',
      users: 12,
      apiConnections: 8
    },
    { 
      id: '2', 
      name: 'Oslo Scrap Yard', 
      status: 'Pending', 
      plan: 'Starter', 
      revenue: '€890',
      orgNumber: '923456789',
      vatNumber: 'NO923456789MVA',
      address: 'Hovedgata 15, 0150 Oslo, Norway',
      adminName: 'Erik Hansen',
      adminEmail: 'erik@osloscrap.no',
      users: 5,
      apiConnections: 3
    },
    { 
      id: '3', 
      name: 'Copenhagen Metals', 
      status: 'Active', 
      plan: 'Enterprise', 
      revenue: '€4,200',
      orgNumber: '12345678',
      vatNumber: 'DK12345678',
      address: 'Nyhavn 12, 1051 Copenhagen, Denmark',
      adminName: 'Niels Petersen',
      adminEmail: 'niels@copenhagenmetal.dk',
      users: 25,
      apiConnections: 15
    }
  ];

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

  const selectedTenantData = tenants.find(t => t.id === selectedTenant);

  // Update form data when selected tenant changes
  React.useEffect(() => {
    if (selectedTenantData) {
      setFormData({
        companyName: selectedTenantData.name,
        orgNumber: selectedTenantData.orgNumber,
        vatNumber: selectedTenantData.vatNumber,
        address: selectedTenantData.address,
        adminName: selectedTenantData.adminName,
        adminEmail: selectedTenantData.adminEmail,
        plan: selectedTenantData.plan.toLowerCase(),
        monthlyRevenue: selectedTenantData.revenue,
        invoiceEmail: selectedTenantData.adminEmail
      });
    } else {
      // Reset form data when no tenant is selected
      setFormData({});
    }
  }, [selectedTenantData]);

  const handleSelectTenant = (tenantId: string) => {
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
      const tenantIndex = tenants.findIndex(t => t.id === selectedTenant);
      if (tenantIndex !== -1) {
        tenants[tenantIndex].plan = value.charAt(0).toUpperCase() + value.slice(1);
      }
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
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTenant === tenant.id 
                      ? 'border-admin-primary bg-admin-accent/30' 
                      : 'hover:bg-admin-accent/10'
                  }`}
                  onClick={() => handleSelectTenant(tenant.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{tenant.name}</h4>
                      <p className="text-xs text-muted-foreground">{tenant.plan} Plan</p>
                    </div>
                    <Badge className={getStatusColor(tenant.status)}>
                      {getStatusIcon(tenant.status)}
                      {tenant.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {tenant.users} users
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {tenant.apiConnections} APIs
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tenant Details */}
          <div className="lg:col-span-2">
            {selectedTenantData ? (
              <Tabs defaultValue="info" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="api">API</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="config">Config</TabsTrigger>
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
                            <Label htmlFor="orgNumber">Organization Number</Label>
                            <Input
                              id="orgNumber"
              value={formData.orgNumber || ''}
                              onChange={(e) => handleInputChange('orgNumber', e.target.value)}
                              disabled={editingSection !== 'company'}
                            />
                          </div>
                          <div>
                            <Label htmlFor="vatNumber">VAT Number</Label>
                            <Input
                              id="vatNumber"
                              value={formData.vatNumber || ''}
                              onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                              disabled={editingSection !== 'company'}
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
                            Address Information
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSection(editingSection === 'address' ? null : 'address')}
                          >
                            {editingSection === 'address' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div>
                          <Label htmlFor="address">Legal Address</Label>
                          <Textarea
                            id="address"
                            value={formData.address || ''}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            disabled={editingSection !== 'address'}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch disabled={editingSection !== 'address'} />
                          <Label>Use different billing address</Label>
                        </div>
                      </div>

                      <Separator />

                      {/* Administrator Information */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Administrator Information
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSection(editingSection === 'admin' ? null : 'admin')}
                          >
                            {editingSection === 'admin' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="adminName">Administrator Name</Label>
                            <Input
                              id="adminName"
                              value={formData.adminName || ''}
                              onChange={(e) => handleInputChange('adminName', e.target.value)}
                              disabled={editingSection !== 'admin'}
                            />
                          </div>
                          <div>
                            <Label htmlFor="adminEmail">Administrator Email</Label>
                            <Input
                              id="adminEmail"
                              value={formData.adminEmail || ''}
                              onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                              disabled={editingSection !== 'admin'}
                            />
                          </div>
                        </div>
                      </div>

                      {editingSection && (
                        <div className="flex gap-2 pt-4">
                          <Button>
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
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {getMockUsers(selectedTenant || '').map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-admin-accent rounded-full">
                                <Users className="h-4 w-4 text-admin-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{user.name}</h4>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary">{user.role}</Badge>
                              <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
                        {getMockApiServices(selectedTenant || '').map((service, index) => (
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
    </div>
  );
};

export default TenantManagement;