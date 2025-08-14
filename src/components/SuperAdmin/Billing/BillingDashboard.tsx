import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Settings, 
  AlertTriangle,
  Car,
  Building2,
  Calendar,
  PieChart,
  ArrowLeft
} from 'lucide-react';
// Temporarily disable billing components that cause crashes
// import { PricingCatalog } from './PricingCatalog';
// import { InvoiceManagement } from './InvoiceManagement';
// import { UsageMetering } from './UsageMetering';
// import { BillingAnalytics } from './BillingAnalytics';
// import { BillingSettings } from './BillingSettings';
import { BillingTest } from './BillingTest';
import { QuickAuth } from './QuickAuth';

interface BillingDashboardProps {
  onBack?: () => void;
}

export const BillingDashboard = ({ onBack }: BillingDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  const billingStats = [
    {
      title: 'Monthly Revenue',
      value: '€28,450',
      change: '+18.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-status-completed'
    },
    {
      title: 'Total COGS',
      value: '€19,200',
      change: '+12.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-status-processing'
    },
    {
      title: 'Gross Margin',
      value: '32.5%',
      change: '+2.3%',
      trend: 'up',
      icon: PieChart,
      color: 'bg-admin-primary'
    },
    {
      title: 'Overdue Invoices',
      value: '3',
      change: '-2',
      trend: 'down',
      icon: AlertTriangle,
      color: 'bg-status-cancelled'
    }
  ];

  const revenueBreakdown = [
    { service: 'Monthly Service Fees', amount: '€12,000', margin: '40%', tenants: 24 },
    { service: 'Car Processing', amount: '€11,250', margin: '25%', cars: 4500 },
    { service: 'SMS Services', amount: '€2,800', margin: '35%', messages: 14000 },
    { service: 'Payment Processing', amount: '€2,400', margin: '20%', transactions: 890 }
  ];

  const marginAlerts = [
    { tenant: 'Oslo Scrap Yard', service: 'Car Processing', margin: '12%', threshold: '20%', severity: 'high' },
    { tenant: 'Copenhagen Metals', service: 'SMS Services', margin: '18%', threshold: '25%', severity: 'medium' }
  ];

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-status-completed' : 'text-status-cancelled';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-status-cancelled text-white';
      case 'medium': return 'bg-status-processing text-white';
      default: return 'bg-status-pending text-white';
    }
  };

  return (
    <div className="theme-admin min-h-screen bg-admin-muted">
      {/* Header */}
      <header className="bg-admin-primary text-admin-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="!border !border-white/30 !bg-transparent !text-white hover:!bg-white/20 hover:!text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <CreditCard className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Billing & Invoice Control</h1>
                <p className="text-admin-primary-foreground/80">Multi-tenant billing management system</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="!border !border-white/30 !bg-transparent !text-white hover:!bg-white/20 hover:!text-white"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Generate Monthly Bills
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-admin-primary">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Overview</TabsTrigger>
            <TabsTrigger value="pricing" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Pricing</TabsTrigger>
            <TabsTrigger value="per-tenant" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Per Tenant</TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Invoices</TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Usage</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:text-admin-primary data-[state=inactive]:text-white hover:bg-white/10">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {billingStats.map((stat, index) => (
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
                    <p className={`text-xs flex items-center gap-1 ${getTrendColor(stat.trend)}`}>
                      {getTrendIcon(stat.trend)}
                      {stat.change}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Breakdown */}
            <Card className="bg-white shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-admin-primary">Revenue Breakdown</CardTitle>
                <CardDescription>Monthly revenue by service type with margin analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-admin-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-admin-accent rounded-full">
                          <DollarSign className="h-4 w-4 text-admin-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{item.service}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.tenants ? `${item.tenants} tenants` : 
                             item.cars ? `${item.cars} cars` : 
                             item.messages ? `${item.messages} messages` :
                             item.transactions ? `${item.transactions} transactions` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{item.amount}</p>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                        </div>
                        <Badge className="bg-status-completed text-white">
                          {item.margin} margin
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Margin Alerts */}
            <Card className="bg-white shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-admin-primary flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-status-cancelled" />
                  Margin Alerts
                </CardTitle>
                <CardDescription>Services with margins below threshold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marginAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-status-cancelled/10 border border-status-cancelled/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-status-cancelled" />
                        <div>
                          <p className="font-medium">{alert.tenant}</p>
                          <p className="text-sm text-muted-foreground">{alert.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-status-cancelled">{alert.margin}</p>
                          <p className="text-sm text-muted-foreground">vs {alert.threshold} threshold</p>
                        </div>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="space-y-6">
              <QuickAuth />
              <BillingTest />
              <div className="p-6 text-center">
                <p className="text-muted-foreground">Pricing catalog temporarily disabled</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="per-tenant">
            <div className="space-y-6">
              <Card className="bg-white shadow-custom-sm">
                <CardHeader>
                  <CardTitle className="text-admin-primary">Per Tenant Pricing Matrix</CardTitle>
                  <CardDescription>Overview of pricing models and VAT configuration per tenant</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Tenant Pricing Overview */}
                    {[
                      {
                        id: '1',
                        name: 'Panta Bilen Stockholm',
                        plan: 'Premium',
                        monthlyFee: '€149',
                        smsUsage: '1,250/2,000',
                        carsProcessed: '425/2,000',
                        apiRequests: '45,000/100,000',
                        vat: '25%',
                        totalMonthly: '€2,450',
                        status: 'Active'
                      },
                      {
                        id: '2',
                        name: 'Oslo Scrap Yard',
                        plan: 'Starter',
                        monthlyFee: '€49',
                        smsUsage: '320/500',
                        carsProcessed: '180/500',
                        apiRequests: '12,000/25,000',
                        vat: '25%',
                        totalMonthly: '€890',
                        status: 'Active'
                      },
                      {
                        id: '3',
                        name: 'Copenhagen Metals',
                        plan: 'Enterprise',
                        monthlyFee: '€399',
                        smsUsage: '8,450/10,000',
                        carsProcessed: '2,100/5,000',
                        apiRequests: '180,000/500,000',
                        vat: '25%',
                        totalMonthly: '€4,200',
                        status: 'Active'
                      }
                    ].map((tenant) => (
                      <div key={tenant.id} className="p-4 border rounded-lg hover:bg-admin-accent/10 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-admin-accent rounded-full">
                              <Building2 className="h-4 w-4 text-admin-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{tenant.name}</h4>
                              <p className="text-sm text-muted-foreground">ID: {tenant.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${tenant.plan === 'Enterprise' ? 'bg-admin-primary' : tenant.plan === 'Premium' ? 'bg-status-processing' : 'bg-status-pending'} text-white`}>
                              {tenant.plan}
                            </Badge>
                            <Badge className="bg-status-completed text-white">
                              {tenant.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          <div className="text-center p-3 bg-admin-accent/10 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">Monthly Fee</p>
                            <p className="text-lg font-bold text-admin-primary">{tenant.monthlyFee}</p>
                          </div>
                          <div className="text-center p-3 bg-admin-accent/10 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">SMS Usage</p>
                            <p className="text-lg font-bold">{tenant.smsUsage}</p>
                          </div>
                          <div className="text-center p-3 bg-admin-accent/10 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">Cars Processed</p>
                            <p className="text-lg font-bold">{tenant.carsProcessed}</p>
                          </div>
                          <div className="text-center p-3 bg-admin-accent/10 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">API Requests</p>
                            <p className="text-lg font-bold">{tenant.apiRequests}</p>
                          </div>
                          <div className="text-center p-3 bg-admin-accent/10 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">VAT Rate</p>
                            <p className="text-lg font-bold">{tenant.vat}</p>
                          </div>
                          <div className="text-center p-3 bg-admin-primary/10 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">Total Monthly</p>
                            <p className="text-lg font-bold text-admin-primary">{tenant.totalMonthly}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Service Pricing Breakdown */}
              <Card className="bg-white shadow-custom-sm">
                <CardHeader>
                  <CardTitle className="text-admin-primary">Service Pricing Breakdown</CardTitle>
                  <CardDescription>Detailed pricing structure per service across all tenants</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Service</th>
                          <th className="text-left p-3 font-semibold">Starter</th>
                          <th className="text-left p-3 font-semibold">Premium</th>
                          <th className="text-left p-3 font-semibold">Enterprise</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-admin-accent/10">
                          <td className="p-3 font-medium">Platform Base Fee</td>
                          <td className="p-3">€49/month</td>
                          <td className="p-3">€149/month</td>
                          <td className="p-3">€399/month</td>
                        </tr>
                        <tr className="border-b hover:bg-admin-accent/10">
                          <td className="p-3 font-medium">SMS (per message)</td>
                          <td className="p-3">€0.05 (500 incl.)</td>
                          <td className="p-3">€0.04 (2,000 incl.)</td>
                          <td className="p-3">€0.03 (10,000 incl.)</td>
                        </tr>
                        <tr className="border-b hover:bg-admin-accent/10">
                          <td className="p-3 font-medium">Car Processing</td>
                          <td className="p-3">€2.50 (500 incl.)</td>
                          <td className="p-3">€2.00 (2,000 incl.)</td>
                          <td className="p-3">€1.50 (5,000 incl.)</td>
                        </tr>
                        <tr className="border-b hover:bg-admin-accent/10">
                          <td className="p-3 font-medium">Google Maps API</td>
                          <td className="p-3">€0.005 (25,000 incl.)</td>
                          <td className="p-3">€0.004 (100,000 incl.)</td>
                          <td className="p-3">€0.003 (500,000 incl.)</td>
                        </tr>
                        <tr className="border-b hover:bg-admin-accent/10">
                          <td className="p-3 font-medium">VAT Rate</td>
                          <td className="p-3">25% (Sweden)</td>
                          <td className="p-3">25% (Sweden)</td>
                          <td className="p-3">25% (Sweden)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Invoice management temporarily disabled</p>
            </div>
          </TabsContent>

          <TabsContent value="usage">
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Usage metering temporarily disabled</p>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Analytics temporarily disabled</p>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Settings temporarily disabled</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};