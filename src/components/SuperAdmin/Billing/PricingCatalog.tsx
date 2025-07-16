import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Percent, 
  Car, 
  MessageSquare, 
  CreditCard, 
  Server,
  Save,
  Map,
  Smartphone,
  Settings,
  TrendingUp,
  Users,
  History,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface PricingRule {
  id: string;
  service: string;
  type: 'fixed' | 'per_unit' | 'tiered';
  baseCost: number;
  markup: number;
  markupType: 'percentage' | 'fixed';
  includedUnits?: number;
  tiers?: { upTo: number | null; costPerUnit: number }[];
  description: string;
  enabled: boolean;
  icon: any;
  vatRate?: number;
}

interface SubscriptionTier {
  id: string;
  name: 'Starter' | 'Premium' | 'Enterprise';
  baseFee: number;
  maxSMS: number;
  maxCarsProcessed: number;
  maxGoogleMapsRequests: number;
  autoUpgrade: boolean;
  color: string;
}

interface VATConfig {
  defaultRate: number;
  countryRates: { country: string; rate: number }[];
  serviceOverrides: { serviceId: string; rate: number }[];
}

interface TenantPricing {
  tenantId: string;
  tenantName: string;
  currentTier: 'Starter' | 'Premium' | 'Enterprise';
  customPricing: { serviceId: string; customRate: number }[];
  vatExempt: boolean;
}

export const PricingCatalog = () => {
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('pricing-rules');

  // Core Services Data
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    {
      id: '1',
      service: 'Platform Base Service Fee',
      type: 'fixed',
      baseCost: 29.00,
      markup: 20,
      markupType: 'percentage',
      description: 'Monthly platform access and core features',
      enabled: true,
      icon: Server,
      vatRate: 25
    },
    {
      id: '2',
      service: 'Car Processing',
      type: 'tiered',
      baseCost: 0.12,
      markup: 25,
      markupType: 'percentage',
      includedUnits: 100,
      tiers: [
        { upTo: 500, costPerUnit: 0.12 },
        { upTo: 2000, costPerUnit: 0.08 },
        { upTo: null, costPerUnit: 0.05 }
      ],
      description: 'Vehicle intake, processing, and output management',
      enabled: true,
      icon: Car,
      vatRate: 25
    },
    {
      id: '3',
      service: 'SMS Services',
      type: 'per_unit',
      baseCost: 0.08,
      markup: 40,
      markupType: 'percentage',
      description: 'SMS notifications and customer communications',
      enabled: true,
      icon: MessageSquare,
      vatRate: 25
    },
    {
      id: '4',
      service: 'Google Maps API',
      type: 'per_unit',
      baseCost: 0.005,
      markup: 300,
      markupType: 'percentage',
      description: 'Map services, geocoding, and location features',
      enabled: true,
      icon: Map,
      vatRate: 25
    }
  ]);

  // Subscription Tiers
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([
    {
      id: '1',
      name: 'Starter',
      baseFee: 49.00,
      maxSMS: 500,
      maxCarsProcessed: 200,
      maxGoogleMapsRequests: 1000,
      autoUpgrade: true,
      color: 'bg-blue-500'
    },
    {
      id: '2',
      name: 'Premium',
      baseFee: 149.00,
      maxSMS: 2000,
      maxCarsProcessed: 1000,
      maxGoogleMapsRequests: 5000,
      autoUpgrade: true,
      color: 'bg-purple-500'
    },
    {
      id: '3',
      name: 'Enterprise',
      baseFee: 399.00,
      maxSMS: 10000,
      maxCarsProcessed: 5000,
      maxGoogleMapsRequests: 25000,
      autoUpgrade: false,
      color: 'bg-gold-500'
    }
  ]);

  // VAT Configuration
  const [vatConfig, setVatConfig] = useState<VATConfig>({
    defaultRate: 25,
    countryRates: [
      { country: 'Sweden', rate: 25 },
      { country: 'Norway', rate: 25 },
      { country: 'Denmark', rate: 25 },
      { country: 'Finland', rate: 24 }
    ],
    serviceOverrides: []
  });

  // Sample Tenant Data
  const [tenantPricing, setTenantPricing] = useState<TenantPricing[]>([
    {
      tenantId: '1',
      tenantName: 'ScrapYard AB',
      currentTier: 'Premium',
      customPricing: [],
      vatExempt: false
    },
    {
      tenantId: '2',
      tenantName: 'NordPlock AS',
      currentTier: 'Enterprise',
      customPricing: [{ serviceId: '3', customRate: 0.06 }],
      vatExempt: false
    },
    {
      tenantId: '3',
      tenantName: 'Baltic Motors',
      currentTier: 'Starter',
      customPricing: [],
      vatExempt: true
    }
  ]);

  const getServiceIcon = (service: string) => {
    const rule = pricingRules.find(r => r.service === service);
    return rule?.icon || DollarSign;
  };

  const calculatePrice = (rule: PricingRule, quantity = 1) => {
    let price = rule.baseCost;
    
    if (rule.markupType === 'percentage') {
      price = price * (1 + rule.markup / 100);
    } else {
      price = price + rule.markup;
    }
    
    return price * quantity;
  };

  const getMargin = (rule: PricingRule) => {
    if (rule.markupType === 'percentage') {
      return `${rule.markup}%`;
    } else {
      const margin = (rule.markup / (rule.baseCost + rule.markup)) * 100;
      return `${margin.toFixed(1)}%`;
    }
  };

  // Helper functions
  const calculatePriceWithVAT = (rule: PricingRule, quantity = 1) => {
    const basePrice = calculatePrice(rule, quantity);
    const vatRate = rule.vatRate || vatConfig.defaultRate;
    return basePrice * (1 + vatRate / 100);
  };

  const getTierColor = (tierName: string) => {
    const tier = subscriptionTiers.find(t => t.name === tierName);
    return tier?.color || 'bg-gray-500';
  };

  const handleSaveTier = (tier: SubscriptionTier) => {
    if (isEditMode) {
      setSubscriptionTiers(prev => prev.map(t => t.id === tier.id ? tier : t));
    } else {
      setSubscriptionTiers(prev => [...prev, { ...tier, id: Date.now().toString() }]);
    }
    setSelectedTier(null);
    setIsEditMode(false);
  };

  const handleSaveRule = (rule: PricingRule) => {
    if (isEditMode) {
      setPricingRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    } else {
      setPricingRules(prev => [...prev, { ...rule, id: Date.now().toString() }]);
    }
    setSelectedRule(null);
    setIsEditMode(false);
  };

  const handleDeleteRule = (ruleId: string) => {
    setPricingRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const PricingRuleForm = ({ rule, onSave }: { rule?: PricingRule; onSave: (rule: PricingRule) => void }) => {
    const [formData, setFormData] = useState<PricingRule>(rule || {
      id: '',
      service: '',
      type: 'fixed',
      baseCost: 0,
      markup: 0,
      markupType: 'percentage',
      description: '',
      enabled: true,
      icon: DollarSign,
      vatRate: 25
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="service">Service Name</Label>
            <Input
              id="service"
              value={formData.service}
              onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
              placeholder="e.g. SMS Services"
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Pricing Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="per_unit">Per Unit</SelectItem>
                <SelectItem value="tiered">Tiered Pricing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="baseCost">Base Cost (€)</Label>
            <Input
              id="baseCost"
              type="number"
              step="0.01"
              value={formData.baseCost}
              onChange={(e) => setFormData(prev => ({ ...prev, baseCost: parseFloat(e.target.value) }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="markup">Markup</Label>
            <div className="flex gap-2">
              <Input
                id="markup"
                type="number"
                step="0.01"
                value={formData.markup}
                onChange={(e) => setFormData(prev => ({ ...prev, markup: parseFloat(e.target.value) }))}
                required
              />
              <Select value={formData.markupType} onValueChange={(value) => setFormData(prev => ({ ...prev, markupType: value as any }))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">€</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="vatRate">VAT Rate (%)</Label>
            <Input
              id="vatRate"
              type="number"
              value={formData.vatRate || 25}
              onChange={(e) => setFormData(prev => ({ ...prev, vatRate: parseFloat(e.target.value) }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Service description..."
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
          />
          <Label htmlFor="enabled">Enable this pricing rule</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setSelectedRule(null)}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save Rule
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-admin-primary">Pricing Management</h2>
          <p className="text-muted-foreground">Configure service pricing, subscription tiers, and VAT settings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pricing-rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="subscription-tiers">Subscription Tiers</TabsTrigger>
          <TabsTrigger value="vat-config">VAT Configuration</TabsTrigger>
          <TabsTrigger value="tenant-matrix">Tenant Matrix</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        {/* Pricing Rules Tab */}
        <TabsContent value="pricing-rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Service Pricing Structure</h3>
              <p className="text-sm text-muted-foreground">Manage base costs, markups, and pricing tiers for all services</p>
            </div>
            <Dialog open={!!selectedRule} onOpenChange={(open) => !open && setSelectedRule(null)}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-admin-primary hover:bg-admin-primary/90"
                  onClick={() => {
                    setSelectedRule({} as PricingRule);
                    setIsEditMode(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {isEditMode ? 'Edit Pricing Rule' : 'Add New Service'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure pricing rules for services with cost and markup settings
                  </DialogDescription>
                </DialogHeader>
                {selectedRule && (
                  <PricingRuleForm 
                    rule={isEditMode ? selectedRule : undefined} 
                    onSave={handleSaveRule}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pricingRules.map((rule) => {
              const IconComponent = rule.icon;
              return (
                <Card key={rule.id} className="bg-white shadow-custom-sm hover:shadow-custom-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-admin-accent rounded-full">
                          <IconComponent className="h-5 w-5 text-admin-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{rule.service}</CardTitle>
                          <CardDescription>{rule.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedRule(rule); setIsEditMode(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteRule(rule.id)} className="text-status-cancelled hover:text-status-cancelled">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Base Cost:</span>
                        <span className="font-semibold">€{rule.baseCost.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Markup:</span>
                        <span className="font-semibold">{rule.markupType === 'percentage' ? `${rule.markup}%` : `€${rule.markup.toFixed(2)}`}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Net Price:</span>
                        <span className="font-semibold">€{calculatePrice(rule).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Price + VAT:</span>
                        <span className="font-semibold text-admin-primary">€{calculatePriceWithVAT(rule).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">VAT Rate:</span>
                        <Badge variant="outline">{rule.vatRate || vatConfig.defaultRate}%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Margin:</span>
                        <Badge className="bg-status-completed text-white">{getMargin(rule)}</Badge>
                      </div>
                      {rule.type === 'tiered' && rule.includedUnits && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Included Units:</span>
                          <span className="text-sm">{rule.includedUnits} free</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge className={rule.enabled ? 'bg-status-completed text-white' : 'bg-muted'}>
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Subscription Tiers Tab */}
        <TabsContent value="subscription-tiers" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Subscription Tiers</h3>
              <p className="text-sm text-muted-foreground">Configure Starter, Premium, and Enterprise tier limits and pricing</p>
            </div>
            <Button className="bg-admin-primary hover:bg-admin-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionTiers.map((tier) => (
              <Card key={tier.id} className={`relative overflow-hidden ${tier.name === 'Premium' ? 'ring-2 ring-admin-primary' : ''}`}>
                <div className={`absolute inset-x-0 top-0 h-1 ${tier.color}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <div className="text-2xl font-bold text-admin-primary">€{tier.baseFee}/mo</div>
                    </div>
                    {tier.name === 'Premium' && (
                      <Badge className="bg-admin-primary text-white">Popular</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">SMS Messages:</span>
                      <span className="font-semibold">{tier.maxSMS.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cars Processed:</span>
                      <span className="font-semibold">{tier.maxCarsProcessed.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Map Requests:</span>
                      <span className="font-semibold">{tier.maxGoogleMapsRequests.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto-upgrade:</span>
                      <Badge className={tier.autoUpgrade ? 'bg-status-completed text-white' : 'bg-muted'}>
                        {tier.autoUpgrade ? 'Enabled' : 'Manual'}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Tier
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* VAT Configuration Tab */}
        <TabsContent value="vat-config" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">VAT Configuration</h3>
            <p className="text-sm text-muted-foreground">Manage VAT rates by country and service overrides</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Default VAT Settings</CardTitle>
                <CardDescription>Base VAT rate applied to all services unless overridden</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultVat">Default VAT Rate (%)</Label>
                  <Input
                    id="defaultVat"
                    type="number"
                    value={vatConfig.defaultRate}
                    onChange={(e) => setVatConfig(prev => ({ ...prev, defaultRate: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <Button className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Default Rate
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Country-Specific VAT Rates</CardTitle>
                <CardDescription>Override VAT rates for specific countries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vatConfig.countryRates.map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-admin-accent rounded-lg">
                      <span className="font-medium">{country.country}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{country.rate}%</span>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Country
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tenant Matrix Tab */}
        <TabsContent value="tenant-matrix" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Tenant Pricing Matrix</h3>
            <p className="text-sm text-muted-foreground">Compare pricing tiers and custom rates across all tenants</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tenant Comparison Matrix</CardTitle>
              <CardDescription>Overview of subscription tiers and custom pricing per tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Tenant</th>
                      <th className="text-left p-3 font-medium">Current Tier</th>
                      <th className="text-left p-3 font-medium">Monthly Base</th>
                      <th className="text-left p-3 font-medium">Custom Pricing</th>
                      <th className="text-left p-3 font-medium">VAT Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantPricing.map((tenant) => {
                      const currentTier = subscriptionTiers.find(t => t.name === tenant.currentTier);
                      return (
                        <tr key={tenant.tenantId} className="border-b hover:bg-admin-accent">
                          <td className="p-3 font-medium">{tenant.tenantName}</td>
                          <td className="p-3">
                            <Badge className={`${getTierColor(tenant.currentTier)} text-white`}>
                              {tenant.currentTier}
                            </Badge>
                          </td>
                          <td className="p-3">€{currentTier?.baseFee.toFixed(2)}/mo</td>
                          <td className="p-3">
                            {tenant.customPricing.length > 0 ? (
                              <Badge variant="outline">{tenant.customPricing.length} overrides</Badge>
                            ) : (
                              <span className="text-muted-foreground">Standard</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge className={tenant.vatExempt ? 'bg-yellow-500 text-white' : 'bg-status-completed text-white'}>
                              {tenant.vatExempt ? 'Exempt' : 'Standard VAT'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Cost Forecasting Tool</h3>
            <p className="text-sm text-muted-foreground">Estimate monthly costs based on usage scenarios</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Simulation</CardTitle>
                <CardDescription>Input expected usage to calculate estimated costs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="simSMS">SMS Messages per month</Label>
                  <Input id="simSMS" type="number" placeholder="e.g. 1500" />
                </div>
                <div>
                  <Label htmlFor="simCars">Cars processed per month</Label>
                  <Input id="simCars" type="number" placeholder="e.g. 800" />
                </div>
                <div>
                  <Label htmlFor="simMaps">Google Maps requests per month</Label>
                  <Input id="simMaps" type="number" placeholder="e.g. 3000" />
                </div>
                <Button className="w-full bg-admin-primary hover:bg-admin-primary/90">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Calculate Forecast
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Estimated monthly costs based on usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Base Platform Fee:</span>
                    <span className="font-semibold">€149.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">SMS Services:</span>
                    <span className="font-semibold">€168.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Car Processing:</span>
                    <span className="font-semibold">€78.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Google Maps:</span>
                    <span className="font-semibold">€60.00</span>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-semibold">€455.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">VAT (25%):</span>
                    <span className="font-semibold">€113.75</span>
                  </div>
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-bold">Total Monthly Cost:</span>
                    <span className="font-bold text-admin-primary">€568.75</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-admin-accent rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-status-completed" />
                    <span>Recommended tier: <strong>Premium</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};