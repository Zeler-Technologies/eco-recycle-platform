import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calendar, 
  Download,
  Building2,
  AlertTriangle
} from 'lucide-react';

export const BillingAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const revenueData = [
    { month: 'Aug', revenue: 22450, cogs: 16200, margin: 6250 },
    { month: 'Sep', revenue: 24100, cogs: 17800, margin: 6300 },
    { month: 'Oct', revenue: 26200, cogs: 19100, margin: 7100 },
    { month: 'Nov', revenue: 25800, cogs: 18900, margin: 6900 },
    { month: 'Dec', revenue: 27500, cogs: 20200, margin: 7300 },
    { month: 'Jan', revenue: 28450, cogs: 19200, margin: 9250 }
  ];

  const marginTrendData = [
    { month: 'Aug', margin: 27.8 },
    { month: 'Sep', margin: 26.1 },
    { month: 'Oct', margin: 27.1 },
    { month: 'Nov', margin: 26.7 },
    { month: 'Dec', margin: 26.5 },
    { month: 'Jan', margin: 32.5 }
  ];

  const serviceRevenueData = [
    { name: 'Monthly Service', value: 12000, color: '#3b82f6' },
    { name: 'Car Processing', value: 11250, color: '#10b981' },
    { name: 'SMS Services', value: 2800, color: '#f59e0b' },
    { name: 'Payment Processing', value: 2400, color: '#ef4444' }
  ];

  const tenantPerformanceData = [
    { name: 'Panta Bilen Stockholm', revenue: 2450, margin: 35.2, growth: 12.5 },
    { name: 'Copenhagen Metals', revenue: 4200, margin: 28.1, growth: 8.7 },
    { name: 'Göteborg Recycling', revenue: 3100, margin: 31.5, growth: 15.3 },
    { name: 'Oslo Scrap Yard', revenue: 890, margin: 18.2, growth: -2.1 }
  ];

  const kpiData = [
    {
      title: 'Average Revenue per Tenant',
      value: '€2,371',
      change: '+8.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-status-completed'
    },
    {
      title: 'Overall Margin',
      value: '32.5%',
      change: '+4.2%',
      trend: 'up',
      icon: Percent,
      color: 'bg-admin-primary'
    },
    {
      title: 'Customer Lifetime Value',
      value: '€28,450',
      change: '+12.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-status-processing'
    },
    {
      title: 'Churn Rate',
      value: '2.1%',
      change: '-0.8%',
      trend: 'down',
      icon: TrendingDown,
      color: 'bg-status-pending'
    }
  ];

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-status-completed' : 'text-status-cancelled';
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'bg-status-completed text-white';
    if (margin >= 20) return 'bg-status-processing text-white';
    return 'bg-status-cancelled text-white';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-admin-primary">Billing Analytics</h2>
          <p className="text-muted-foreground">Revenue insights and margin analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="12months">12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="bg-white shadow-custom-sm hover:shadow-custom-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${kpi.color} text-white`}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={`text-xs flex items-center gap-1 ${getTrendColor(kpi.trend)}`}>
                {getTrendIcon(kpi.trend)}
                {kpi.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue and Margin Chart */}
      <Card className="bg-white shadow-custom-sm">
        <CardHeader>
          <CardTitle>Revenue & Margin Analysis</CardTitle>
          <CardDescription>Monthly revenue, costs, and margin trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar dataKey="cogs" fill="#ef4444" name="COGS" />
                <Bar dataKey="margin" fill="#10b981" name="Margin" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin Trend */}
        <Card className="bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle>Margin Trend</CardTitle>
            <CardDescription>Monthly margin percentage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marginTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line 
                    type="monotone" 
                    dataKey="margin" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Service Revenue Breakdown */}
        <Card className="bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle>Revenue by Service</CardTitle>
            <CardDescription>Monthly revenue breakdown by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceRevenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Performance */}
      <Card className="bg-white shadow-custom-sm">
        <CardHeader>
          <CardTitle>Tenant Performance</CardTitle>
          <CardDescription>Revenue, margin, and growth by tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenantPerformanceData.map((tenant, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-admin-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-admin-accent rounded-full">
                    <Building2 className="h-4 w-4 text-admin-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{tenant.name}</h4>
                    <p className="text-sm text-muted-foreground">Monthly revenue</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(tenant.revenue)}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getMarginColor(tenant.margin)}>
                      {tenant.margin.toFixed(1)}%
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">Margin</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tenant.growth >= 0 ? 'text-status-completed' : 'text-status-cancelled'}`}>
                      {tenant.growth >= 0 ? '+' : ''}{tenant.growth.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Growth</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Recommendations */}
      <Card className="bg-white shadow-custom-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-processing" />
            Insights & Recommendations
          </CardTitle>
          <CardDescription>AI-powered insights to optimize billing performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-status-completed/10 border border-status-completed/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-status-completed" />
                <span className="font-medium text-status-completed">Opportunity</span>
              </div>
              <p className="text-sm">
                Consider increasing car processing markup for high-volume tenants ({'>'}2000 cars/month) to 30% to improve overall margin.
              </p>
            </div>
            <div className="p-4 bg-status-processing/10 border border-status-processing/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-status-processing" />
                <span className="font-medium text-status-processing">Warning</span>
              </div>
              <p className="text-sm">
                Oslo Scrap Yard has a low margin (18.2%) and negative growth. Consider reviewing their pricing structure or usage patterns.
              </p>
            </div>
            <div className="p-4 bg-admin-primary/10 border border-admin-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-admin-primary" />
                <span className="font-medium text-admin-primary">Revenue Optimization</span>
              </div>
              <p className="text-sm">
                SMS services show the highest margin (35%). Consider promoting SMS-based features to increase revenue per tenant.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};