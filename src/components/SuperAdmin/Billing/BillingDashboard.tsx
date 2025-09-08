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

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle>Database Access Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircleIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              The billing dashboard cannot access invoice data because the browser client is unauthenticated.
              <br />
              <strong>Root cause:</strong> auth.uid() returns null
            </p>
            <div className="bg-muted p-4 rounded-lg text-left max-w-2xl mx-auto">
              <h4 className="font-semibold mb-2">Your invoice data exists:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                <li>3 invoices in database (IDs: 8, 9, 10)</li>
                <li>Total amount: 375.00 SEK</li>
                <li>Billing month: 2025-09-01</li>
                <li>All invoices have status: pending</li>
              </ul>
              
              <h4 className="font-semibold mb-2">Solutions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  <strong>Quick fix (temporary):</strong>
                  <br />
                  <code className="bg-background px-2 py-1 rounded text-xs">
                    ALTER TABLE scrapyard_invoices DISABLE ROW LEVEL SECURITY;
                  </code>
                </li>
                <li>
                  <strong>Proper fix:</strong> Implement authentication so browser client runs with authenticated user who has super_admin role
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices visible</h3>
            <p className="text-muted-foreground mb-4">
              Invoices exist but are blocked by RLS policies
            </p>
            <p className="text-xs text-muted-foreground">
              Switch to September 2025 and check browser console for debugging logs
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDashboard;