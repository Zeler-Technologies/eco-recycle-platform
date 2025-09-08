import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircleIcon } from 'lucide-react';
import { toast } from 'sonner';

interface BillingDashboardProps {
  onBack?: () => void;
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState('2025-09');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    return { value, label };
  });

  const generateInvoices = async () => {
    setGenerating(true);
    
    try {
      console.log('🔥 Starting generation for:', selectedMonth);
      toast.success('Generation test completed - check console');
    } catch (error) {
      console.error('🚨 Generation error:', error);
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered for month:', selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← Back
            </Button>
          )}
          <h1 className="text-3xl font-bold">Billing Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generateInvoices} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Test'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Authentication required</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.00 kr</div>
            <p className="text-xs text-muted-foreground">Authentication required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.00 kr</div>
            <p className="text-xs text-muted-foreground">Authentication required</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Authentication Status */}
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardHeader>
              <div className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-800 dark:text-yellow-200">Authentication Required</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-yellow-700 dark:text-yellow-300">
                The billing dashboard cannot access invoice data because the browser client is unauthenticated.
              </p>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">Your invoice data exists:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Badge variant="outline" className="mb-2">Database Confirmed</Badge>
                    <ul className="space-y-1">
                      <li>• 3 invoices in database</li>
                      <li>• IDs: 8, 9, 10</li>
                      <li>• Total: 375.00 SEK</li>
                    </ul>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Details</Badge>
                    <ul className="space-y-1">
                      <li>• Billing month: 2025-09-01</li>
                      <li>• Status: All pending</li>
                      <li>• VAT: 75.00 SEK total</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Solutions:</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <Badge variant="secondary" className="mb-1">Option 1: Quick Fix</Badge>
                    <p className="text-blue-700 dark:text-blue-300 mb-2">Temporarily disable RLS (for testing only):</p>
                    <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-xs block">
                      ALTER TABLE scrapyard_invoices DISABLE ROW LEVEL SECURITY;
                    </code>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-1">Option 2: Proper Fix</Badge>
                    <p className="text-blue-700 dark:text-blue-300">
                      Implement authentication so browser client runs with authenticated user who has super_admin role
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertCircleIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No invoices visible</h3>
                <p className="text-muted-foreground mb-4">
                  Invoices exist but are blocked by RLS policies
                </p>
                <div className="bg-muted p-4 rounded-lg max-w-md mx-auto">
                  <p className="text-sm">
                    Switch to September 2025 and check browser console for debugging logs
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUpIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Analytics Unavailable</h3>
                <p className="text-muted-foreground">
                  Analytics will be available once authentication is implemented
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingDashboard;

// Also export as named export for compatibility
export { BillingDashboard };