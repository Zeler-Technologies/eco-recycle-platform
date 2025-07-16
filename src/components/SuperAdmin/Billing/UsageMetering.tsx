import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Car, 
  MessageSquare, 
  CreditCard, 
  Upload, 
  Download, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Building2
} from 'lucide-react';

interface UsageData {
  id: string;
  tenantId: string;
  tenantName: string;
  period: string;
  carProcessing: number;
  smsMessages: number;
  paymentTransactions: number;
  storageUsage: number;
  lastUpdated: string;
}

interface UsageMetric {
  service: string;
  total: number;
  change: number;
  trend: 'up' | 'down';
  unit: string;
  icon: any;
  color: string;
}

export const UsageMetering = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedTenant, setSelectedTenant] = useState('all');

  const [usageData, setUsageData] = useState<UsageData[]>([
    {
      id: '1',
      tenantId: 'tenant_001',
      tenantName: 'Panta Bilen Stockholm',
      period: 'February 2024',
      carProcessing: 1450,
      smsMessages: 2800,
      paymentTransactions: 145,
      storageUsage: 2.3,
      lastUpdated: '2024-02-15 10:30:00'
    },
    {
      id: '2',
      tenantId: 'tenant_002',
      tenantName: 'Oslo Scrap Yard',
      period: 'February 2024',
      carProcessing: 890,
      smsMessages: 1650,
      paymentTransactions: 89,
      storageUsage: 1.8,
      lastUpdated: '2024-02-15 10:25:00'
    },
    {
      id: '3',
      tenantId: 'tenant_003',
      tenantName: 'Copenhagen Metals',
      period: 'February 2024',
      carProcessing: 2100,
      smsMessages: 4200,
      paymentTransactions: 210,
      storageUsage: 3.1,
      lastUpdated: '2024-02-15 10:20:00'
    }
  ]);

  const usageMetrics: UsageMetric[] = [
    {
      service: 'Car Processing',
      total: usageData.reduce((sum, data) => sum + data.carProcessing, 0),
      change: 12.5,
      trend: 'up',
      unit: 'cars',
      icon: Car,
      color: 'bg-status-completed'
    },
    {
      service: 'SMS Messages',
      total: usageData.reduce((sum, data) => sum + data.smsMessages, 0),
      change: 8.3,
      trend: 'up',
      unit: 'messages',
      icon: MessageSquare,
      color: 'bg-status-processing'
    },
    {
      service: 'Payment Transactions',
      total: usageData.reduce((sum, data) => sum + data.paymentTransactions, 0),
      change: -2.1,
      trend: 'down',
      unit: 'transactions',
      icon: CreditCard,
      color: 'bg-admin-primary'
    },
    {
      service: 'Storage Usage',
      total: usageData.reduce((sum, data) => sum + data.storageUsage, 0),
      change: 15.7,
      trend: 'up',
      unit: 'GB',
      icon: Activity,
      color: 'bg-status-pending'
    }
  ];

  const filteredUsageData = usageData.filter(data => {
    return selectedTenant === 'all' || data.tenantId === selectedTenant;
  });

  const handleImportUsage = () => {
    // Mock import functionality
    console.log('Importing usage data...');
  };

  const handleExportUsage = () => {
    // Mock export functionality
    console.log('Exporting usage data...');
  };

  const handleRefreshUsage = () => {
    // Mock refresh functionality
    console.log('Refreshing usage data...');
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-status-completed' : 'text-status-cancelled';
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat().format(number);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-admin-primary">Usage Metering</h2>
          <p className="text-muted-foreground">Track and analyze tenant resource usage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportUsage}>
            <Upload className="h-4 w-4 mr-2" />
            Import Usage
          </Button>
          <Button variant="outline" onClick={handleExportUsage}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button 
            className="bg-admin-primary hover:bg-admin-primary/90"
            onClick={handleRefreshUsage}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {usageMetrics.map((metric, index) => (
          <Card key={index} className="bg-white shadow-custom-sm hover:shadow-custom-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.service}
              </CardTitle>
              <div className={`p-2 rounded-full ${metric.color} text-white`}>
                <metric.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metric.total)}</div>
              <p className={`text-xs flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)}
                {metric.change > 0 ? '+' : ''}{metric.change}% vs last month
              </p>
              <p className="text-xs text-muted-foreground mt-1">{metric.unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-custom-sm">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Month</SelectItem>
                  <SelectItem value="previous">Previous Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  <SelectItem value="tenant_001">Panta Bilen Stockholm</SelectItem>
                  <SelectItem value="tenant_002">Oslo Scrap Yard</SelectItem>
                  <SelectItem value="tenant_003">Copenhagen Metals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Data Table */}
      <Card className="bg-white shadow-custom-sm">
        <CardHeader>
          <CardTitle>Usage Data</CardTitle>
          <CardDescription>Detailed usage statistics by tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Cars
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payments
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Storage (GB)
                  </div>
                </TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsageData.map((data) => (
                <TableRow key={data.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-admin-primary" />
                      <span className="font-medium">{data.tenantName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{data.period}</TableCell>
                  <TableCell>
                    <Badge className="bg-status-completed text-white">
                      {formatNumber(data.carProcessing)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-status-processing text-white">
                      {formatNumber(data.smsMessages)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-admin-primary text-white">
                      {formatNumber(data.paymentTransactions)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-status-pending text-white">
                      {data.storageUsage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {data.lastUpdated}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle>Top Usage by Tenant</CardTitle>
            <CardDescription>Car processing usage this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usageData
                .sort((a, b) => b.carProcessing - a.carProcessing)
                .map((data, index) => (
                  <div key={data.id} className="flex items-center justify-between p-3 bg-admin-accent/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-admin-primary text-white rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{data.tenantName}</p>
                        <p className="text-sm text-muted-foreground">{data.period}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatNumber(data.carProcessing)}</p>
                      <p className="text-sm text-muted-foreground">cars</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle>Usage Anomalies</CardTitle>
            <CardDescription>Unusual usage patterns requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-status-cancelled/10 border border-status-cancelled/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-status-cancelled/20 rounded-full">
                    <TrendingUp className="h-4 w-4 text-status-cancelled" />
                  </div>
                  <div>
                    <p className="font-medium">Oslo Scrap Yard</p>
                    <p className="text-sm text-muted-foreground">SMS usage spike: +150%</p>
                  </div>
                </div>
                <Badge className="bg-status-cancelled text-white">High</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-status-processing/10 border border-status-processing/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-status-processing/20 rounded-full">
                    <TrendingDown className="h-4 w-4 text-status-processing" />
                  </div>
                  <div>
                    <p className="font-medium">Copenhagen Metals</p>
                    <p className="text-sm text-muted-foreground">Car processing drop: -25%</p>
                  </div>
                </div>
                <Badge className="bg-status-processing text-white">Medium</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};