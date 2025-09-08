import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, DollarSignIcon, FileTextIcon, TrendingUpIcon, AlertCircleIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Simple type that avoids TypeScript depth issues
type SimpleInvoice = {
  id: number;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  tax_amount: number;
  status: string;
  description?: string;
};

type BillingStats = {
  totalInvoices: number;
  totalRevenue: number;
  totalTax: number;
  averageAmount: number;
};

const BillingDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState('2025-09');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    return { value, label };
  });

  const fetchStats = async () => {
    console.log('🔥 fetchStats STARTED for month:', selectedMonth);
    const startDate = `${selectedMonth}-01`;
    
    try {
      const { data, error } = await supabase
        .from('scrapyard_invoices')
        .select('total_amount, tax_amount')
        .eq('billing_month', startDate);

      console.log('🔥 Stats result:', { error, dataLength: data?.length });

      if (error) {
        console.error('🚨 Stats error:', error);
        return;
      }

      if (data && data.length > 0) {
        const totalInvoices = data.length;
        const totalRevenue = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalTax = data.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
        const averageAmount = totalRevenue / totalInvoices;

        setStats({ totalInvoices, totalRevenue, totalTax, averageAmount });
        console.log('🔥 Stats set:', { totalInvoices, totalRevenue, totalTax });
      } else {
        setStats({ totalInvoices: 0, totalRevenue: 0, totalTax: 0, averageAmount: 0 });
      }
    } catch (err) {
      console.error('🚨 Stats fetch error:', err);
    }
  };

  const fetchInvoices = async () => {
    console.log('🔥 fetchInvoices STARTED for month:', selectedMonth);
    setLoading(true);

    const startDate = `${selectedMonth}-01`;
    
    try {
      const { data, error } = await supabase
        .from('scrapyard_invoices')
        .select('id, invoice_number, invoice_date, total_amount, tax_amount, status, description')
        .eq('billing_month', startDate)
        .order('id', { ascending: false });

      console.log('🔥 Invoices result:', { error, dataLength: data?.length });

      if (error) {
        console.error('🚨 Invoices error:', error);
        toast.error('Failed to fetch invoices');
      } else {
        const simpleInvoices: SimpleInvoice[] = (data || []).map(item => ({
          id: item.id,
          invoice_number: item.invoice_number || '',
          invoice_date: item.invoice_date || '',
          total_amount: item.total_amount || 0,
          tax_amount: item.tax_amount || 0,
          status: item.status || 'pending',
          description: item.description || undefined
        }));
        
        setInvoices(simpleInvoices);
        console.log('🔥 Invoices set:', simpleInvoices.length);
      }
    } catch (err) {
      console.error('🚨 Invoices fetch error:', err);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoices = async () => {
    setGenerating(true);
    
    try {
      console.log('🔥 Starting generation for:', selectedMonth);
      
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('tenants_id, name')
        .limit(1);
      
      console.log('🔥 Tenants result:', { tenants, tenantError });
      
      if (tenantError) {
        toast.error('Failed to fetch tenants');
        return;
      }
      
      toast.success('Generation test completed');
      
      // Refresh data
      await fetchStats();
      await fetchInvoices();
      
    } catch (error) {
      console.error('🚨 Generation error:', error);
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered for month:', selectedMonth);
    fetchStats();
    fetchInvoices();
  }, [selectedMonth]);

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} kr`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Billing Dashboard</h1>
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
            {generating ? 'Generating...' : 'Generate Monthly Invoices'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalTax)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageAmount)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Invoices</CardTitle>
          <CardDescription>
            Generated invoices for {monthOptions.find(opt => opt.value === selectedMonth)?.label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(invoice.tax_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <AlertCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-4">
                No invoices have been generated for {monthOptions.find(opt => opt.value === selectedMonth)?.label}
              </p>
              <Button onClick={generateInvoices} disabled={generating}>
                {generating ? 'Generating...' : 'Generate Invoices'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDashboard;