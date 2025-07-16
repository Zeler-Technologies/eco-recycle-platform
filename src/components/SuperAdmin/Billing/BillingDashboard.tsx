import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { PricingCatalog } from './PricingCatalog';
import { InvoiceManagement } from './InvoiceManagement';
import { UsageMetering } from './UsageMetering';
import { BillingAnalytics } from './BillingAnalytics';
import { BillingSettings } from './BillingSettings';

export const BillingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

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
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="border-admin-primary-foreground/30 text-admin-primary-foreground hover:bg-admin-primary-foreground/10"
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
                variant="outline"
                size="sm"
                className="border-admin-primary-foreground/30 text-admin-primary-foreground hover:bg-admin-primary-foreground/10"
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
            <PricingCatalog />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoiceManagement />
          </TabsContent>

          <TabsContent value="usage">
            <UsageMetering />
          </TabsContent>

          <TabsContent value="analytics">
            <BillingAnalytics />
          </TabsContent>

          <TabsContent value="settings">
            <BillingSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};