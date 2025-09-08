import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface BillingDashboardProps {
  onBack?: () => void;
}

interface ServiceConfig {
  name: string;
  description: string;
  internalCost: number;
  markup: number;
  finalPrice: number;
  margin: number;
  enabled: boolean;
  icon: string;
}

interface TenantConfig {
  name: string;
  vatRate: number;
  vatCountry: string;
  vatExempt: boolean;
  pricingModel: string;
  invoiceEmail: string;
}

const BillingDashboard = ({ onBack }: BillingDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState('2025-09');
  const [selectedTenant, setSelectedTenant] = useState('tenant_1');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Stats State
  const [statsData, setStatsData] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    totalVat: 0,
    activeTenants: 0
  });

  // Per-tenant configurations
  const [tenantConfigs, setTenantConfigs] = useState<{[key: string]: TenantConfig}>({
    tenant_1: {
      name: 'Stockholm Scrapyard AB',
      vatRate: 25,
      vatCountry: 'Sweden',
      vatExempt: false,
      pricingModel: 'Premium',
      invoiceEmail: 'billing@stockholmscrap.se'
    },
    tenant_2: {
      name: 'Malmö Auto Recycling',
      vatRate: 25,
      vatCountry: 'Sweden', 
      vatExempt: false,
      pricingModel: 'Starter',
      invoiceEmail: 'accounting@malmoauto.se'
    },
    tenant_3: {
      name: 'Göteborg Bil Återvinning',
      vatRate: 25,
      vatCountry: 'Sweden',
      vatExempt: true,
      pricingModel: 'Enterprise', 
      invoiceEmail: 'faktura@goteborgbil.se'
    }
  });

  // Usage data
  const usageData = {
    smsServicesSent: 1250,
    carsProcessed: 320,
    mapsApiRequests: 2150
  };

  // Comprehensive Analytics Dashboard Component
  const AnalyticsDashboard = () => {
    const [timeFilter, setTimeFilter] = useState('monthly');
    const [selectedYear, setSelectedYear] = useState('2025');
    
    // Mock comprehensive analytics data
    const analyticsData = {
      monthly: {
        '2025': {
          revenue: [125000, 132000, 145000, 158000, 167000, 172000, 186000, 195000, 203000, 215000, 228000, 240000],
          invoices: [45, 48, 52, 55, 58, 61, 65, 68, 71, 75, 79, 83],
          pickups: [320, 340, 365, 380, 395, 410, 425, 440, 455, 470, 485, 500],
          tenants: [25, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
          serviceCosts: [89000, 94000, 102000, 108000, 115000, 120000, 128000, 134000, 140000, 147000, 154000, 162000]
        }
      },
      quarterly: {
        '2025': {
          revenue: [402000, 497000, 584000, 683000],
          invoices: [145, 174, 204, 237],
          pickups: [1025, 1230, 1320, 1455],
          tenants: [25, 30, 33, 37],
          serviceCosts: [285000, 343000, 402000, 463000]
        }
      },
      yearly: {
        revenue: [1680000, 2166000],
        invoices: [650, 760],
        pickups: [4200, 5030],
        tenants: [28, 37],
        serviceCosts: [1250000, 1493000]
      }
    };

    const tenantPerformance = [
      { name: 'Stockholm Scrapyard AB', revenue: 485000, pickups: 1250, growth: 15.3, margin: 23.5 },
      { name: 'Malmö Auto Recycling', revenue: 342000, pickups: 890, growth: 12.7, margin: 19.2 },
      { name: 'Göteborg Bil Återvinning', revenue: 398000, pickups: 1080, growth: 18.9, margin: 25.1 },
      { name: 'Uppsala Återvinning', revenue: 276000, pickups: 720, growth: 8.4, margin: 16.8 },
      { name: 'Norrköping Auto Parts', revenue: 189000, pickups: 510, growth: 22.1, margin: 21.3 }
    ];

    const serviceBreakdown = [
      { service: 'Platform Service', revenue: 186000, percentage: 25.3, trend: 'up' },
      { service: 'SMS Services', revenue: 142000, percentage: 19.3, trend: 'up' },
      { service: 'Car Processing', revenue: 298000, percentage: 40.5, trend: 'stable' },
      { service: 'Google Maps API', revenue: 109000, percentage: 14.9, trend: 'up' }
    ];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const years = ['2024', '2025'];

    const getCurrentData = () => {
      if (timeFilter === 'yearly') return analyticsData.yearly;
      return analyticsData[timeFilter][selectedYear];
    };

    const getLabels = () => {
      if (timeFilter === 'yearly') return years;
      if (timeFilter === 'quarterly') return quarters;
      return months;
    };

    const calculateGrowth = (data: number[]) => {
      if (data.length < 2) return 0;
      const current = data[data.length - 1];
      const previous = data[data.length - 2];
      return ((current - previous) / previous * 100);
    };

    const currentData = getCurrentData();
    const labels = getLabels();

    return (
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
            {timeFilter !== 'yearly' && (
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="p-2 border rounded-lg"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            )}
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-800">{formatCurrency(currentData.revenue.reduce((a, b) => a + b, 0))}</p>
                <p className="text-sm text-blue-600">Growth: +{calculateGrowth(currentData.revenue).toFixed(1)}%</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Pickups</p>
                <p className="text-2xl font-bold text-green-800">{currentData.pickups.reduce((a, b) => a + b, 0).toLocaleString()}</p>
                <p className="text-sm text-green-600">Growth: +{calculateGrowth(currentData.pickups).toFixed(1)}%</p>
              </div>
              <div className="text-3xl">🚛</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Active Tenants</p>
                <p className="text-2xl font-bold text-purple-800">{Math.max(...currentData.tenants)}</p>
                <p className="text-sm text-purple-600">New: +{Math.max(...currentData.tenants) - Math.min(...currentData.tenants)}</p>
              </div>
              <div className="text-3xl">🏢</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Profit Margin</p>
                <p className="text-2xl font-bold text-orange-800">
                  {(((currentData.revenue.reduce((a, b) => a + b, 0) - currentData.serviceCosts.reduce((a, b) => a + b, 0)) / currentData.revenue.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-orange-600">Target: 25%</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </Card>
        </div>

        {/* Revenue vs Service Costs Chart */}
        <Card className="p-6">
          <h4 className="text-lg font-bold mb-4">Revenue vs Service Costs Over Time</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold mb-2 text-blue-600">Revenue Trend</h5>
                <div className="space-y-2">
                  {currentData.revenue.map((value, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{labels[index]}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${(value / Math.max(...currentData.revenue)) * 100}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-bold w-20 text-right">{formatCurrency(value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-semibold mb-2 text-red-600">Service Costs</h5>
                <div className="space-y-2">
                  {currentData.serviceCosts.map((value, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{labels[index]}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{width: `${(value / Math.max(...currentData.serviceCosts)) * 100}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-bold w-20 text-right">{formatCurrency(value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Invoicing Performance */}
        <Card className="p-6">
          <h4 className="text-lg font-bold mb-4">Invoicing Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h5 className="font-semibold mb-2">Invoice Volume</h5>
              <div className="space-y-2">
                {currentData.invoices.map((value, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm">{labels[index]}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">Average Invoice Value</h5>
              <div className="space-y-2">
                {currentData.revenue.map((revenue, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm">{labels[index]}</span>
                    <span className="font-bold">{formatCurrency(revenue / currentData.invoices[index])}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold mb-2">Revenue per Pickup</h5>
              <div className="space-y-2">
                {currentData.revenue.map((revenue, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm">{labels[index]}</span>
                    <span className="font-bold">{formatCurrency(revenue / currentData.pickups[index])}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Tenant Performance Rankings */}
        <Card className="p-6">
          <h4 className="text-lg font-bold mb-4">Top Performing Tenants</h4>
          <div className="space-y-4">
            {tenantPerformance.map((tenant, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h6 className="font-semibold">{tenant.name}</h6>
                    <p className="text-sm text-gray-600">{tenant.pickups} pickups</p>
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

        {/* Service Performance Breakdown */}
        <Card className="p-6">
          <h4 className="text-lg font-bold mb-4">Service Revenue Breakdown</h4>
          <div className="space-y-4">
            {serviceBreakdown.map((service, index) => (
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
                  <div className="flex items-center space-x-1">
                    <span className={`text-sm ${service.trend === 'up' ? 'text-green-600' : service.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {service.trend === 'up' ? '↗' : service.trend === 'down' ? '↘' : '→'}
                    </span>
                    <span className="text-sm text-gray-600">{service.trend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Business Intelligence Insights */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h4 className="text-lg font-bold mb-4">Business Intelligence Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold mb-2 text-blue-600">Revenue Insights</h5>
              <ul className="space-y-2 text-sm">
                <li>• Revenue growth accelerating: +{calculateGrowth(currentData.revenue).toFixed(1)}% this period</li>
                <li>• Stockholm Scrapyard AB leading with highest margins (23.5%)</li>
                <li>• Car Processing service generating 40.5% of total revenue</li>
                <li>• Average invoice value trending upward across all tenants</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2 text-purple-600">Operational Insights</h5>
              <ul className="space-y-2 text-sm">
                <li>• Pickup efficiency improving: +{calculateGrowth(currentData.pickups).toFixed(1)}% more pickups</li>
                <li>• {Math.max(...currentData.tenants) - Math.min(...currentData.tenants)} new tenants added this period</li>
                <li>• Service costs well controlled at {((currentData.serviceCosts.reduce((a, b) => a + b, 0) / currentData.revenue.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}% of revenue</li>
                <li>• SMS and Maps API services showing strong growth trends</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Service configurations with editable pricing
  const [serviceConfigs, setServiceConfigs] = useState<ServiceConfig[]>([
    {
      name: 'Platform Base Service',
      description: 'Monthly platform access',
      internalCost: 29.00,
      markup: 20,
      finalPrice: 34.80,
      margin: 16.7,
      enabled: true,
      icon: '🌐'
    },
    {
      name: 'SMS Services',
      description: 'Per SMS sent',
      internalCost: 0.08,
      markup: 40,
      finalPrice: 0.112,
      margin: 28.6,
      enabled: true,
      icon: '📞'
    },
    {
      name: 'Car Processing',
      description: 'Per vehicle processed',
      internalCost: 0.12,
      markup: 25,
      finalPrice: 0.15,
      margin: 20.0,
      enabled: true,
      icon: '🚗'
    },
    {
      name: 'Google Maps API',
      description: 'Per API request',
      internalCost: 0.005,
      markup: 300,
      finalPrice: 0.020,
      margin: 75.0,
      enabled: true,
      icon: '📍'
    }
  ]);

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

  // Mock invoice data
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

  // Helper functions
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getCurrentTenantConfig = (): TenantConfig => {
    return tenantConfigs[selectedTenant] || tenantConfigs.tenant_1;
  };

  const updateTenantConfig = (field: string, value: any) => {
    setTenantConfigs(prev => ({
      ...prev,
      [selectedTenant]: {
        ...prev[selectedTenant],
        [field]: value
      }
    }));
  };

  // Update service config calculations
  const updateServiceConfig = (index: number, field: string, value: number) => {
    const updated = [...serviceConfigs];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'internalCost' || field === 'markup') {
      const finalPrice = updated[index].internalCost * (1 + updated[index].markup / 100);
      const margin = ((finalPrice - updated[index].internalCost) / finalPrice) * 100;
      updated[index].finalPrice = finalPrice;
      updated[index].margin = margin;
    }
    
    setServiceConfigs(updated);
  };

  const calculateBillingEstimate = () => {
    const tenantConfig = getCurrentTenantConfig();
    const baseFee = tenantConfig.pricingModel === 'Premium' ? 149.00 : 
                   tenantConfig.pricingModel === 'Starter' ? 49.00 : 399.00;
    
    const smsUsageCost = usageData.smsServicesSent * serviceConfigs[1].finalPrice;
    const carProcessingCost = usageData.carsProcessed * serviceConfigs[2].finalPrice;
    const mapsApiCost = usageData.mapsApiRequests * serviceConfigs[3].finalPrice;
    
    const usageEstimate = smsUsageCost + carProcessingCost + mapsApiCost;
    const subtotal = baseFee + usageEstimate;
    const vatAmount = tenantConfig.vatExempt ? 0 : (subtotal * tenantConfig.vatRate / 100);
    const total = subtotal + vatAmount;

    return {
      baseFee,
      usageEstimate,
      vatAmount,
      total
    };
  };

  const fetchInvoices = async () => {
    console.log('fetchInvoices STARTED for month:', selectedMonth, 'tenant:', selectedTenant);
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filtered = selectedMonth === '2025-09' ? mockInvoiceData : [];
      if (selectedTenant !== 'all') {
        filtered = filtered.filter(invoice => invoice.tenant_id === selectedTenant);
      }
      
      setInvoiceData(filtered);
      console.log('Invoices set to state:', filtered.length);
      
      if (filtered.length > 0) {
        const tenantName = selectedTenant === 'all' ? 'all tenants' : getCurrentTenantConfig().name;
        showNotification(`Loaded ${filtered.length} invoices for ${tenantName} in ${selectedMonth}`);
      }
    } catch (err) {
      console.error('Invoices fetch error:', err);
      showNotification('Failed to fetch invoices', 'error');
      setInvoiceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingOverview = async () => {
    console.log('fetchBillingOverview STARTED for month:', selectedMonth, 'tenant:', selectedTenant);

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
        console.log('Overview calculated:', { totalInvoices, totalRevenue, totalVat, activeTenants });
      } else {
        setStatsData({ totalInvoices: 0, totalRevenue: 0, totalVat: 0, activeTenants: 0 });
      }
    } catch (err) {
      console.error('Overview fetch error:', err);
      setStatsData({ totalInvoices: 0, totalRevenue: 0, totalVat: 0, activeTenants: 0 });
    }
  };

  const generateInvoices = async () => {
    setGenerating(true);
    
    try {
      console.log('Starting invoice generation for:', selectedMonth);
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification('Invoice generation completed successfully');
      await fetchBillingOverview();
      await fetchInvoices();
    } catch (error) {
      console.error('Generation error:', error);
      showNotification('Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const saveBillingConfiguration = () => {
    const tenantConfig = getCurrentTenantConfig();
    showNotification(`Billing configuration saved for ${tenantConfig.name}`);
    console.log('Saved configuration for tenant:', selectedTenant, tenantConfig);
  };

  useEffect(() => {
    console.log('useEffect triggered for month:', selectedMonth, 'tenant:', selectedTenant);
    fetchBillingOverview();
    fetchInvoices();
  }, [selectedMonth, selectedTenant]);

  const formatCurrency = (amount: number, currency = 'SEK') => `${amount.toFixed(2)} ${currency}`;
  const billingEstimate = calculateBillingEstimate();

  // Notification Component
  const NotificationToast = () => {
    if (!notification) return null;
    
    return (
      <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 
        'bg-red-100 text-red-800 border border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          <span>{notification.type === 'success' ? '✓' : '✗'}</span>
          <span>{notification.message}</span>
        </div>
      </div>
    );
  };

  // VAT Configuration Component - Enhanced to match screenshots
  const VATConfigurationSection = () => {
    const tenantConfig = getCurrentTenantConfig();
    
    if (selectedTenant === 'all') {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Select a specific tenant to configure VAT settings</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-blue-600 mb-4">
          <span className="text-xl font-bold">%</span>
          <h3 className="text-xl font-bold">VAT Configuration</h3>
        </div>
        <p className="text-gray-600 mb-6">Configure VAT settings for this tenant</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Default VAT Rate (%)</label>
            <Input
              type="number"
              value={tenantConfig.vatRate}
              onChange={(e) => updateTenantConfig('vatRate', Number(e.target.value))}
              className="w-20 text-center text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">VAT Country</label>
            <select 
              value={tenantConfig.vatCountry} 
              onChange={(e) => updateTenantConfig('vatCountry', e.target.value)}
              className="w-full p-3 border rounded-lg bg-gray-50"
            >
              <option value="Sweden">Sweden (25%)</option>
              <option value="Denmark">Denmark (25%)</option>
              <option value="Norway">Norway (25%)</option>
            </select>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4">Service-specific VAT Rates</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Platform Service', rate: tenantConfig.vatRate },
              { name: 'SMS Services', rate: tenantConfig.vatRate },
              { name: 'Car Processing', rate: tenantConfig.vatRate },
              { name: 'Google Maps', rate: tenantConfig.vatRate }
            ].map((service) => (
              <div key={service.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">{service.name}</span>
                <span className="font-bold text-lg">{service.rate}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="vatExempt"
            checked={tenantConfig.vatExempt}
            onChange={(e) => updateTenantConfig('vatExempt', e.target.checked)}
            className="w-5 h-5 rounded"
          />
          <label htmlFor="vatExempt" className="text-sm font-medium">VAT Exempt Tenant</label>
        </div>
      </div>
    );
  };

  // Billing Overview Component - Enhanced to match screenshots
  const BillingOverviewSection = () => {
    const tenantConfig = getCurrentTenantConfig();
    
    if (selectedTenant === 'all') {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Select a specific tenant to view billing overview</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-blue-600 mb-4">
          <span className="text-xl">📊</span>
          <h3 className="text-xl font-bold">Billing Overview</h3>
        </div>
        <p className="text-gray-600 mb-6">Current billing configuration and estimated costs</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium mb-2">Active Pricing Model</h4>
            <Badge className="bg-blue-600 text-white px-4 py-2 text-sm font-medium">
              {tenantConfig.pricingModel} €{tenantConfig.pricingModel === 'Premium' ? '149' : tenantConfig.pricingModel === 'Starter' ? '49' : '399'}/month
            </Badge>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Monthly Estimate</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Fee:</span>
                <span className="font-bold">€{billingEstimate.baseFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Usage (est.):</span>
                <span className="font-bold">€{billingEstimate.usageEstimate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT ({tenantConfig.vatRate}%):</span>
                <span className="font-bold">€{billingEstimate.vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total:</span>
                <span>€{billingEstimate.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4">Service Usage Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>SMS Services ({usageData.smsServicesSent.toLocaleString()} sent)</span>
              <span className="font-bold">€{(usageData.smsServicesSent * serviceConfigs[1].finalPrice).toFixed(2)} (incl. VAT)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Car Processing ({usageData.carsProcessed} vehicles)</span>
              <span className="font-bold">€{(usageData.carsProcessed * serviceConfigs[2].finalPrice).toFixed(2)} (incl. VAT)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Google Maps API ({usageData.mapsApiRequests.toLocaleString()} requests)</span>
              <span className="font-bold">€{(usageData.mapsApiRequests * serviceConfigs[3].finalPrice).toFixed(2)} (incl. VAT)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Service Pricing Matrix Component - Matching Image 2
  const ServicePricingMatrix = () => {
    const tenantConfig = getCurrentTenantConfig();
    
    if (selectedTenant === 'all') {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Select a specific tenant to configure service pricing</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-blue-600 mb-4">
          <span className="text-xl">📊</span>
          <h3 className="text-xl font-bold">Pricing Model Configuration</h3>
        </div>
        <p className="text-gray-600 mb-6">Select and configure the pricing model for this tenant</p>
        
        {/* Pricing Tier Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { name: 'Starter', price: 49, features: 'Basic features, up to 500 SMS/month', color: 'border-gray-300' },
            { name: 'Premium', price: 149, features: 'Enhanced features, up to 2000 SMS/month', color: 'border-blue-500 bg-blue-50' },
            { name: 'Enterprise', price: 399, features: 'Full features, up to 10000 SMS/month', color: 'border-gray-300' }
          ].map((model) => (
            <Card 
              key={model.name}
              className={`p-6 cursor-pointer border-2 transition-all ${
                tenantConfig.pricingModel === model.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => updateTenantConfig('pricingModel', model.name)}
            >
              <h4 className="font-bold text-lg text-center mb-2">{model.name}</h4>
              <p className="text-sm text-gray-600 text-center mb-4">{model.features}</p>
              <p className="text-blue-600 font-bold text-xl text-center">€{model.price}/month</p>
            </Card>
          ))}
        </div>

        {/* Invoice Email and Revenue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Invoice Email</label>
            <Input
              type="email"
              value={tenantConfig.invoiceEmail}
              onChange={(e) => updateTenantConfig('invoiceEmail', e.target.value)}
              className="w-full"
              placeholder="billing@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Current Monthly Revenue</label>
            <div className="text-2xl font-bold text-gray-600">€0</div>
          </div>
        </div>

        {/* Service Pricing Matrix */}
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-4">
            <span className="text-lg">⚙️</span>
            <h4 className="font-bold text-lg">Service Pricing Matrix</h4>
          </div>
          <p className="text-gray-600 mb-6">Configure pricing for individual services</p>
          
          <div className="space-y-6">
            {serviceConfigs.map((service, index) => (
              <Card key={service.name} className="p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <h5 className="font-bold text-lg">{service.name}</h5>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={service.enabled}
                      onChange={(e) => {
                        const updated = [...serviceConfigs];
                        updated[index].enabled = e.target.checked;
                        setServiceConfigs(updated);
                      }}
                      className="w-6 h-6 text-blue-600 rounded"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Internal Cost</label>
                    <Input
                      type="number"
                      step="0.001"
                      value={service.internalCost}
                      onChange={(e) => updateServiceConfig(index, 'internalCost', Number(e.target.value))}
                      className="w-full font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Markup</label>
                    <Input
                      type="number"
                      value={service.markup}
                      onChange={(e) => updateServiceConfig(index, 'markup', Number(e.target.value))}
                      className="w-full font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Final Price</label>
                    <div className="font-bold text-lg py-2">€{service.finalPrice.toFixed(3)}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Margin</label>
                    <div className="font-bold text-lg text-blue-600 py-2">{service.margin.toFixed(1)}%</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <NotificationToast />
      <div className="space-y-6 bg-gray-50 min-h-screen p-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="outline" onClick={onBack}>← Back</Button>
            )}
            <div>
              <h1 className="text-3xl font-bold">Billing Dashboard</h1>
              <p className="text-gray-600">Manage service costs, usage tracking, and invoice generation</p>
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
            { id: 'vat', label: 'VAT Reports' },
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
          <Card className="bg-white shadow-sm">
            <CardContent className="p-8 space-y-12">
              <VATConfigurationSection />
              <div className="border-t border-gray-200"></div>
              <BillingOverviewSection />
              <div className="flex space-x-4 pt-8">
                <Button onClick={saveBillingConfiguration} className="bg-blue-600 text-white px-8 py-3">
                  💾 Save Billing Configuration
                </Button>
                <Button variant="outline" className="px-8 py-3 flex items-center space-x-2">
                  <span>🕒</span>
                  <span>View Change History</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'service' && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-8">
              <ServicePricingMatrix />
            </CardContent>
          </Card>
        )}

        {activeTab === 'invoices' && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Monthly Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading invoices...</div>
              ) : invoiceData.length > 0 ? (
                <div className="space-y-1">
                  <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 font-bold text-sm rounded-lg">
                    <div>Invoice #</div>
                    <div>Date</div>
                    <div>Amount</div>
                    <div>VAT</div>
                    <div>Status</div>
                    <div>Tenant</div>
                  </div>
                  {invoiceData.map((invoice) => (
                    <div key={invoice.id} className="grid grid-cols-6 gap-4 p-4 border-b hover:bg-gray-50 rounded">
                      <div className="font-medium">{invoice.invoice_number}</div>
                      <div>{invoice.invoice_date}</div>
                      <div className="font-bold">{formatCurrency(invoice.total_amount)}</div>
                      <div className="font-bold">{formatCurrency(invoice.tax_amount)}</div>
                      <div>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="font-medium">{tenantConfigs[invoice.tenant_id]?.name || `Tenant ${invoice.tenant_id}`}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-gray-500 mb-4 text-lg">
                    No invoices found for {monthOptions.find(m => m.value === selectedMonth)?.label}
                  </div>
                  <div className="text-sm bg-blue-50 p-6 rounded-lg max-w-md mx-auto">
                    <div className="font-medium mb-2">Expected for September 2025:</div>
                    <div>• 3 invoices should exist</div>
                    <div>• Total: 375.00 SEK</div>
                    <div>• Check console logs for query details</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(activeTab === 'monthly' || activeTab === 'vat' || activeTab === 'analytics') && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4">
                {activeTab === 'monthly' ? 'Monthly Billing' :
                 activeTab === 'vat' ? 'VAT Reports' : 'Analytics Dashboard'}
              </h3>
              <p className="text-gray-600 text-lg">
                {activeTab === 'monthly' ? 'Monthly invoice generation and billing management' :
                 activeTab === 'vat' ? 'VAT compliance and reporting tools' :
                 'Business intelligence and usage analytics'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default BillingDashboard;