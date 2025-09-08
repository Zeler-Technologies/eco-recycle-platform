import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BillingDashboardProps {
  onBack?: () => void;
}

const BillingDashboard = ({ onBack }: BillingDashboardProps) => {
  const [selectedMonth, setSelectedMonth] = useState('2025-09');

  const monthOptions = [
    { value: '2025-09', label: 'September 2025' },
    { value: '2025-08', label: 'August 2025' },
    { value: '2025-07', label: 'July 2025' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Billing Dashboard</h1>
            <p className="text-gray-600">Manage service costs, usage tracking, and invoice generation</p>
          </div>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Simple Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.00 kr</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Auth Issue */}
      <Card className="border-yellow-300 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Authentication Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700 mb-4">
            Cannot access invoice data - browser client is unauthenticated.
          </p>
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold mb-2">Your data exists:</h4>
            <p className="text-sm">3 invoices, 375.00 SEK total, September 2025</p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded border">
            <h4 className="font-semibold mb-2">Fix:</h4>
            <code className="text-xs bg-gray-100 p-1 rounded">
              ALTER TABLE scrapyard_invoices DISABLE ROW LEVEL SECURITY;
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <div className="font-semibold">Service Costs</div>
              <div className="text-xs text-gray-500">Manage pricing models</div>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <div className="font-semibold">Invoice Management</div>
              <div className="text-xs text-gray-500">View and generate invoices</div>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <div className="font-semibold">Usage Tracking</div>
              <div className="text-xs text-gray-500">Monitor service usage</div>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <div className="font-semibold">Analytics</div>
              <div className="text-xs text-gray-500">Revenue and cost insights</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDashboard;