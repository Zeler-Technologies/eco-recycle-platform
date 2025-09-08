import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface BillingDashboardProps {
  onBack?: () => void;
}

const BillingDashboard = ({ onBack }: BillingDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState('2025-09');
  const [selectedTenant, setSelectedTenant] = useState('tenant_1');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Analytics state
  const [timeFilter, setTimeFilter] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState('2025');
  
  const [statsData, setStatsData] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    totalVat: 0,
    activeTenants: 0
  });

  // Service configuration state
  const [serviceConfigs, setServiceConfigs] = useState({
    platform: { enabled: true, internalCost: 29.00, markup: 20, finalPrice: 34.80, margin: 16.7 },
    sms: { enabled: true, internalCost: 0.08, markup: 40, finalPrice: 0.112, margin: 28.6 },
    carProcessing: { enabled: true, internalCost: 0.12, markup: 25, finalPrice: 0.15, margin: 20.0 },
    googleMaps: { enabled: true, internalCost: 0.005, markup: 300, finalPrice: 0.020, margin: 75.0 }
  });

  const [tenantConfigs, setTenantConfigs] = useState({
    tenant_1: {
      name: 'Stockholm Scrapyard AB',
      vatRate: 25,
      vatCountry: 'Sweden',
      vatExempt: false,
      pricingModel: 'Premium',
      invoiceEmail: 'billing@stockholmscrap.se',
      monthlyRevenue: 58500,
      serviceRates: {
        platform: 25,
        sms: 25,
        carProcessing: 25,
        googleMaps: 25
      }
    },
    tenant_2: {
      name: 'Malmö Auto Recycling',
      vatRate: 25,
      vatCountry: 'Sweden', 
      vatExempt: false,
      pricingModel: 'Starter',
      invoiceEmail: 'accounting@malmoauto.se',
      monthlyRevenue: 18900,
      serviceRates: {
        platform: 25,
        sms: 25,
        carProcessing: 25,
        googleMaps: 25
      }
    },
    tenant_3: {
      name: 'Göteborg Bil Återvinning',
      vatRate: 0,
      vatCountry: 'Sweden',
      vatExempt: true,
      pricingModel: 'Enterprise',
      invoiceEmail: 'faktura@goteborgbil.se',
      monthlyRevenue: 89300,
      serviceRates: {
        platform: 0,
        sms: 0,
        carProcessing: 0,
        googleMaps: 0
      }
    }
  });

  const monthOptions = [
    { value: '2025-12', label: 'December 2025' },
    { value: '2025-11', label: 'November 2025' },
    { value: '2025-10', label: 'October 2025' },
    { value: '2025-09', label: 'September 2025' },
    { value: '2025-08', label: 'August 2025' }
  ];

  const tenantOptions = [
    { value: 'tenant_1', label: 'Stockholm Scrapyard AB' },
    { value: 'tenant_2', label: 'Malmö Auto Recycling' },
    { value: 'tenant_3', label: 'Göteborg Bil Återvinning' },
    { value: 'all', label: 'All Tenants (Overview)' }
  ];

  const pricingModels = {
    Starter: { basePrice: 49, currency: 'EUR', smsLimit: 500, description: 'Basic plan for small operations' },
    Premium: { basePrice: 149, currency: 'EUR', smsLimit: 2000, description: 'Most popular for growing businesses' },
    Enterprise: { basePrice: 399, currency: 'EUR', smsLimit: 10000, description: 'Advanced features for large operations' }
  };

  const mockInvoiceData = [
    {
      id: 1,
      invoice_number: 'INV-2025-001',
      invoice_date: '2025-09-15',
      total_amount: 125.00,
      tax_amount: 25.00,
      status: 'paid',
      tenant_id: 'tenant_1'
    },
    {
      id: 2,
      invoice_number: 'INV-2025-002',
      invoice_date: '2025-09-20',
      total_amount: 150.00,
      tax_amount: 30.00,
      status: 'pending',
      tenant_id: 'tenant_2'
    },
    {
      id: 3,
      invoice_number: 'INV-2025-003',
      invoice_date: '2025-09-25',
      total_amount: 100.00,
      tax_amount: 20.00,
      status: 'paid',
      tenant_id: 'tenant_3'
    }
  ];

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getCurrentTenantConfig = () => {
    return tenantConfigs[selectedTenant] || tenantConfigs.tenant_1;
  };

  const calculateServiceCosts = () => {
    const config = getCurrentTenantConfig();
    const usageData = {
      sms: 1250,
      carProcessing: 320,
      googleMaps: 2150
    };

    const costs = {
      sms: usageData.sms * serviceConfigs.sms.finalPrice,
      carProcessing: usageData.carProcessing * serviceConfigs.carProcessing.finalPrice,
      googleMaps: usageData.googleMaps * serviceConfigs.googleMaps.finalPrice,
      platform: serviceConfigs.platform.finalPrice
    };

    return costs;
  };

  const calculateMonthlyEstimate = () => {
    const config = getCurrentTenantConfig();
    const model = pricingModels[config.pricingModel];
    const serviceCosts = calculateServiceCosts();
    
    const baseFee = model.basePrice;
    const usageEstimate = Object.values(serviceCosts).reduce((sum, cost) => sum + cost, 0);
    const subtotal = baseFee + usageEstimate;
    const vatAmount = config.vatExempt ? 0 : (subtotal * config.vatRate / 100);
    const total = subtotal + vatAmount;

    return {
      baseFee,
      usageEstimate,
      subtotal,
      vatAmount,
      total,
      serviceCosts
    };
  };

  const updateServiceConfig = (service: string, field: string, value: number) => {
    setServiceConfigs(prev => {
      const updated = { ...prev };
      updated[service] = { ...updated[service], [field]: value };
      
      if (field === 'internalCost' || field === 'markup') {
        const internalCost = field === 'internalCost' ? value : updated[service].internalCost;
        const markup = field === 'markup' ? value : updated[service].markup;
        updated[service].finalPrice = internalCost * (1 + markup / 100);
        updated[service].margin = (markup / (100 + markup)) * 100;
      }
      
      return updated;
    });
  };

  const updateTenantConfig = (field: string, value: any) => {
    if (selectedTenant === 'all') return;
    
    setTenantConfigs(prev => ({
      ...prev,
      [selectedTenant]: {
        ...prev[selectedTenant],
        [field]: value
      }
    }));
  };

  const saveBillingConfiguration = () => {
    showNotification('Billing configuration saved successfully');
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      let filtered = selectedMonth === '2025-09' ? mockInvoiceData : [];
      if (selectedTenant !== 'all') {
        filtered = filtered.filter(invoice => invoice.tenant_id === selectedTenant);
      }
      setInvoiceData(filtered);
      if (filtered.length > 0) {
        showNotification(`Loaded ${filtered.length} invoices`);
      }
    } catch (err) {
      showNotification('Failed to fetch invoices', 'error');
      setInvoiceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingOverview = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (selectedMonth === '2025-09') {
        let data = mockInvoiceData;
        if (selectedTenant !== 'all') {
          data = data.filter(invoice => invoice.tenant_id === selectedTenant);
        }
        const totalInvoices = data.length;
        const totalRevenue = data.reduce((sum, inv) => sum + inv.total_amount, 0);
        const totalVat = data.reduce((sum, inv) => sum + inv.tax_amount, 0);
        const uniqueTenants = new Set(data.map(inv => inv.tenant_id));
        const activeTenants = selectedTenant === 'all' ? uniqueTenants.size : 1;
        setStatsData({ totalInvoices, totalRevenue, totalVat, activeTenants });
      } else {
        setStatsData({ totalInvoices: 0, totalRevenue: 0, totalVat: 0, activeTenants: 0 });
      }
    } catch (err) {
      setStatsData({ totalInvoices: 0, totalRevenue: 0, totalVat: 0, activeTenants: 0 });
    }
  };

  const generateInvoices = async () => {
    setGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification('Invoice generation completed successfully');
      await fetchBillingOverview();
      await fetchInvoices();
    } catch (error) {
      showNotification('Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchBillingOverview();
    fetchInvoices();
  }, [selectedMonth, selectedTenant]);

  const formatCurrency = (amount: number, currency = 'SEK') => `${amount.toFixed(2)} ${currency}`;

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span>{notification.type === 'success' ? '✓' : '✗'}</span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>← Back</Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Billing Dashboard</h1>
            <p className="text-gray-600">Comprehensive billing management and analytics for PantaBilen platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tenant/Scrapyard</label>
            <select 
              value={selectedTenant} 
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-64 p-3 border rounded-lg bg-white"
            >
              {tenantOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-48 p-3 border rounded-lg bg-white"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6">
            <Button 
              onClick={generateInvoices} 
              disabled={generating}
              className="bg-blue-600 text-white px-6 py-3"
            >
              {generating ? 'Generating...' : 'Generate Invoices'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsData.totalInvoices}</div>
            <p className="text-xs text-gray-500">Generated this month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(statsData.totalRevenue)}</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total VAT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(statsData.totalVat)}</div>
            <p className="text-xs text-gray-500">Collected this month</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsData.activeTenants}</div>
            <p className="text-xs text-gray-500">With usage this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 bg-white p-1 rounded-lg shadow-sm">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'service', label: 'Service Costs' },
          { id: 'monthly', label: 'Monthly Billing' },
          { id: 'invoices', label: 'Invoices' },
          { id: 'vat', label: 'VAT Configuration' },
          { id: 'analytics', label: 'Analytics' }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Billing Overview */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-bold">Billing Overview</CardTitle>
              <p className="text-gray-600">Monthly estimates and pricing configuration</p>
            </CardHeader>
            <CardContent className="p-6">
              {selectedTenant !== 'all' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Active Pricing Model */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Active Pricing Model</h4>
                      <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                        {getCurrentTenantConfig().pricingModel}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(pricingModels[getCurrentTenantConfig().pricingModel].basePrice, 'EUR')}
                      </div>
                      <p className="text-sm text-gray-600">per month</p>
                      <p className="text-sm text-gray-700 mt-2">
                        {pricingModels[getCurrentTenantConfig().pricingModel].description}
                      </p>
                    </div>
                  </div>

                  {/* Monthly Estimate */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Monthly Estimate</h4>
                    <div className="space-y-3">
                      {(() => {
                        const estimate = calculateMonthlyEstimate();
                        return (
                          <>
                            <div className="flex justify-between">
                              <span>Base Fee:</span>
                              <span className="font-semibold">{formatCurrency(estimate.baseFee, 'EUR')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Usage (est.):</span>
                              <span className="font-semibold">{formatCurrency(estimate.usageEstimate, 'EUR')}</span>
                            </div>
                            {!getCurrentTenantConfig().vatExempt && (
                              <div className="flex justify-between">
                                <span>VAT ({getCurrentTenantConfig().vatRate}%):</span>
                                <span className="font-semibold">{formatCurrency(estimate.vatAmount, 'EUR')}</span>
                              </div>
                            )}
                            <div className="border-t pt-2">
                              <div className="flex justify-between text-lg font-bold">
                                <span>Total:</span>
                                <span className="text-blue-600">{formatCurrency(estimate.total, 'EUR')}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Select a specific tenant to view billing overview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Usage Summary */}
          {selectedTenant !== 'all' && (
            <Card className="bg-white shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">Service Usage Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    const serviceCosts = calculateServiceCosts();
                    const config = getCurrentTenantConfig();
                    return [
                      {
                        name: 'SMS Services',
                        usage: '1,250 sent',
                        cost: serviceCosts.sms,
                        vatRate: config.serviceRates.sms
                      },
                      {
                        name: 'Car Processing',
                        usage: '320 vehicles',
                        cost: serviceCosts.carProcessing,
                        vatRate: config.serviceRates.carProcessing
                      },
                      {
                        name: 'Google Maps API',
                        usage: '2,150 requests',
                        cost: serviceCosts.googleMaps,
                        vatRate: config.serviceRates.googleMaps
                      },
                      {
                        name: 'Platform Service',
                        usage: 'Base subscription',
                        cost: serviceCosts.platform,
                        vatRate: config.serviceRates.platform
                      }
                    ].map((service, index) => {
                      const vatAmount = config.vatExempt ? 0 : (service.cost * service.vatRate / 100);
                      const totalWithVat = service.cost + vatAmount;
                      return (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-semibold text-sm">{service.name}</h5>
                          <p className="text-xs text-gray-600 mb-2">{service.usage}</p>
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(totalWithVat, 'EUR')}
                          </div>
                          <p className="text-xs text-gray-500">
                            {config.vatExempt ? 'VAT exempt' : `incl. VAT (${service.vatRate}%)`}
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'vat' && (
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-bold">VAT Configuration</CardTitle>
            <p className="text-gray-600">Manage VAT rates and compliance settings</p>
          </CardHeader>
          <CardContent className="p-6">
            {selectedTenant !== 'all' ? (
              <div className="space-y-6">
                {/* VAT Configuration */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Default VAT Rate</h4>
                    <div className="flex items-center space-x-4">
                      <Input
                        type="number"
                        value={getCurrentTenantConfig().vatRate}
                        onChange={(e) => updateTenantConfig('vatRate', parseFloat(e.target.value) || 0)}
                        className="w-24"
                        disabled={getCurrentTenantConfig().vatExempt}
                      />
                      <span className="text-lg font-bold">%</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">VAT Country</h4>
                    <select 
                      value={getCurrentTenantConfig().vatCountry} 
                      onChange={(e) => updateTenantConfig('vatCountry', e.target.value)}
                      className="w-full p-3 border rounded-lg"
                    >
                      <option value="Sweden">Sweden (25%)</option>
                      <option value="Denmark">Denmark (25%)</option>
                      <option value="Norway">Norway (25%)</option>
                    </select>
                  </div>
                </div>

                {/* VAT Exempt Toggle */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="vatExempt"
                    checked={getCurrentTenantConfig().vatExempt}
                    onChange={(e) => updateTenantConfig('vatExempt', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <label htmlFor="vatExempt" className="text-lg font-semibold">
                    VAT Exempt Tenant
                  </label>
                  <p className="text-sm text-gray-600">
                    This tenant is exempt from VAT charges
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button onClick={saveBillingConfiguration} className="bg-blue-600 text-white">
                    Save VAT Configuration
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Select a specific tenant to configure VAT settings</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'service' && (
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-bold">Service Cost Configuration</CardTitle>
            <p className="text-gray-600">Manage pricing models and service costs</p>
          </CardHeader>
          <CardContent className="p-6">
            {selectedTenant !== 'all' ? (
              <div className="space-y-8">
                {/* Pricing Model Selection */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Pricing Model</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(pricingModels).map(([model, details]) => (
                      <div
                        key={model}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          getCurrentTenantConfig().pricingModel === model
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => updateTenantConfig('pricingModel', model)}
                      >
                        <div className="text-center">
                          <h5 className="font-bold text-lg">{model}</h5>
                          <div className="text-2xl font-bold text-blue-600 my-2">
                            {formatCurrency(details.basePrice, details.currency)}
                          </div>
                          <p className="text-sm text-gray-600">{details.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {details.smsLimit} SMS/month included
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Pricing Matrix */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Service Pricing Matrix</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-3 text-left">Service</th>
                          <th className="border p-3 text-left">Enabled</th>
                          <th className="border p-3 text-left">Internal Cost</th>
                          <th className="border p-3 text-left">Markup %</th>
                          <th className="border p-3 text-left">Final Price</th>
                          <th className="border p-3 text-left">Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(serviceConfigs).map(([service, config]) => (
                          <tr key={service}>
                            <td className="border p-3 font-semibold">
                              {service === 'platform' ? 'Platform Service' :
                               service === 'sms' ? 'SMS Services' :
                               service === 'carProcessing' ? 'Car Processing' :
                               'Google Maps API'}
                            </td>
                            <td className="border p-3">
                              <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={(e) => updateServiceConfig(service, 'enabled', e.target.checked)}
                                className="w-5 h-5"
                              />
                            </td>
                            <td className="border p-3">
                              <Input
                                type="number"
                                step="0.001"
                                value={config.internalCost}
                                onChange={(e) => updateServiceConfig(service, 'internalCost', parseFloat(e.target.value) || 0)}
                                className="w-20"
                              />
                            </td>
                            <td className="border p-3">
                              <Input
                                type="number"
                                value={config.markup}
                                onChange={(e) => updateServiceConfig(service, 'markup', parseFloat(e.target.value) || 0)}
                                className="w-20"
                              />
                            </td>
                            <td className="border p-3 font-semibold">
                              {formatCurrency(config.finalPrice, 'EUR')}
                            </td>
                            <td className="border p-3">
                              <span className={`font-semibold ${config.margin > 20 ? 'text-green-600' : 'text-red-600'}`}>
                                {config.margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Invoice Email Configuration */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Invoice Email Configuration</h4>
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">Email Address:</label>
                    <Input
                      type="email"
                      value={getCurrentTenantConfig().invoiceEmail}
                      onChange={(e) => updateTenantConfig('invoiceEmail', e.target.value)}
                      className="flex-1 max-w-md"
                      placeholder="billing@example.com"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={saveBillingConfiguration} className="bg-blue-600 text-white">
                    Save Service Configuration
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Select a specific tenant to configure service costs</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Analytics Dashboard</h3>
                  <p className="text-gray-600">Comprehensive business intelligence and performance metrics</p>
                </div>
                <div className="flex items-center space-x-4">
                  <select 
                    value={timeFilter} 
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="p-2 border rounded-lg"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="p-2 border rounded-lg"
                  >
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-800">2,166,000.00 SEK</p>
                      <p className="text-sm text-blue-600">Growth: +28.9%</p>
                    </div>
                    <div className="text-3xl">💰</div>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Pickups</p>
                      <p className="text-2xl font-bold text-green-800">5,030</p>
                      <p className="text-sm text-green-600">Growth: +19.8%</p>
                    </div>
                    <div className="text-3xl">🚛</div>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Active Tenants</p>
                      <p className="text-2xl font-bold text-purple-800">37</p>
                      <p className="text-sm text-purple-600">New: +9</p>
                    </div>
                    <div className="text-3xl">🏢</div>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Profit Margin</p>
                      <p className="text-2xl font-bold text-orange-800">31.1%</p>
                      <p className="text-sm text-orange-600">Target: 25%</p>
                    </div>
                    <div className="text-3xl">📊</div>
                  </div>
                </Card>
              </div>

              {/* Top Tenants */}
              <Card className="p-6">
                <h4 className="text-lg font-bold mb-4">Top Performing Tenants</h4>
                <div className="space-y-4">
                  {[
                    { name: 'Stockholm Scrapyard AB', revenue: 485000, growth: 15.3, margin: 23.5 },
                    { name: 'Malmö Auto Recycling', revenue: 342000, growth: 12.7, margin: 19.2 },
                    { name: 'Göteborg Bil Återvinning', revenue: 398000, growth: 18.9, margin: 25.1 }
                  ].map((tenant, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h6 className="font-semibold">{tenant.name}</h6>
                          <p className="text-sm text-gray-600">High performer</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(tenant.revenue)}</p>
                        <p className="text-sm text-green-600">+{tenant.growth}% growth</p>
                        <p className="text-sm text-blue-600">{tenant.margin}% margin</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Service Breakdown */}
              <Card className="p-6">
                <h4 className="text-lg font-bold mb-4">Service Revenue Breakdown</h4>
                <div className="space-y-4">
                  {[
                    { service: 'Platform Service', revenue: 186000, percentage: 25.3, trend: 'up' },
                    { service: 'SMS Services', revenue: 142000, percentage: 19.3, trend: 'up' },
                    { service: 'Car Processing', revenue: 298000, percentage: 40.5, trend: 'stable' },
                    { service: 'Google Maps API', revenue: 109000, percentage: 14.9, trend: 'up' }
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          {service.service === 'Platform Service' ? '🌐' :
                           service.service === 'SMS Services' ? '📞' :
                           service.service === 'Car Processing' ? '🚗' : '📍'}
                        </div>
                        <div>
                          <h6 className="font-semibold">{service.service}</h6>
                          <p className="text-sm text-gray-600">{service.percentage}% of total revenue</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(service.revenue)}</p>
                        <p className="text-sm text-green-600">{service.trend}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other basic tabs */}
      {(activeTab === 'monthly' || activeTab === 'invoices') && (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-4">
              {activeTab === 'monthly' ? 'Monthly Billing' : 'Invoice Management'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'monthly' ? 'Generate and manage monthly invoices' : 'View and manage all invoices'}
            </p>
            
            {invoiceData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-3 text-left">Invoice Number</th>
                      <th className="border p-3 text-left">Date</th>
                      <th className="border p-3 text-left">Amount</th>
                      <th className="border p-3 text-left">VAT</th>
                      <th className="border p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="border p-3 font-semibold">{invoice.invoice_number}</td>
                        <td className="border p-3">{invoice.invoice_date}</td>
                        <td className="border p-3 font-semibold">{formatCurrency(invoice.total_amount)}</td>
                        <td className="border p-3">{formatCurrency(invoice.tax_amount)}</td>
                        <td className="border p-3">
                          <Badge className={invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {invoice.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillingDashboard;