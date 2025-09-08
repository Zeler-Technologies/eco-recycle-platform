import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BillingDashboardProps {
  onBack?: () => void;
}

const BillingDashboard = ({ onBack }: BillingDashboardProps) => {
  const [selectedMonth, setSelectedMonth] = useState('2025-09');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    totalVat: 0,
    activeTenants: 0
  });

  const monthOptions = [
    { value: '2025-12', label: 'December 2025' },
    { value: '2025-11', label: 'November 2025' },
    { value: '2025-10', label: 'October 2025' },
    { value: '2025-09', label: 'September 2025' },
    { value: '2025-08', label: 'August 2025' }
  ];

  // Implement Lovable's solution: query by invoice_date range
  const fetchInvoices = async () => {
    console.log('🔥 fetchInvoices STARTED for month:', selectedMonth);
    setLoading(true);

    try {
      // Calculate date range as Lovable specified
      const startDate = `${selectedMonth}-01`;
      const year = parseInt(selectedMonth.split('-')[0]);
      const month = parseInt(selectedMonth.split('-')[1]);
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonthStart = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

      console.log('🔥 Querying invoice_date range:', { startDate, nextMonthStart });

      // Use Lovable's approach: gte/lt instead of eq with billing_month
      const response = await supabase
        .from('scrapyard_invoices')
        .select('id, invoice_number, invoice_date, total_amount, tax_amount, status, tenant_id')
        .gte('invoice_date', startDate)
        .lt('invoice_date', nextMonthStart)
        .order('invoice_date', { ascending: false });

      console.log('🔥 Supabase invoices result:', {
        error: response.error,
        dataLength: response.data?.length,
        sample: response.data?.[0]
      });

      if (response.error) {
        console.error('🚨 Invoices query error:', response.error);
        toast.error('Failed to fetch invoices: ' + response.error.message);
        setInvoiceData([]);
      } else {
        const invoices = response.data || [];
        setInvoiceData(invoices);
        console.log('🔥 Invoices set to state:', invoices.length);
        
        if (invoices.length > 0) {
          toast.success(`Loaded ${invoices.length} invoices for ${selectedMonth}`);
        }
      }
    } catch (err) {
      console.error('🚨 Invoices fetch error:', err);
      toast.error('Failed to fetch invoices - check authentication');
      setInvoiceData([]);
    } finally {
      setLoading(false);
    }
  };

  // Implement Lovable's solution: aggregate stats over same date range
  const fetchBillingOverview = async () => {
    console.log('🔥 fetchBillingOverview STARTED for month:', selectedMonth);

    try {
      // Same date range calculation
      const startDate = `${selectedMonth}-01`;
      const year = parseInt(selectedMonth.split('-')[0]);
      const month = parseInt(selectedMonth.split('-')[1]);
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonthStart = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

      console.log('🔥 Overview querying same date range:', { startDate, nextMonthStart });

      const response = await supabase
        .from('scrapyard_invoices')
        .select('total_amount, tax_amount, tenant_id')
        .gte('invoice_date', startDate)
        .lt('invoice_date', nextMonthStart);

      console.log('🔥 Supabase overview result:', {
        error: response.error,
        dataLength: response.data?.length,
        sample: response.data?.[0]
      });

      if (response.error) {
        console.error('🚨 Overview query error:', response.error);
        setStatsData({ totalInvoices: 0, totalRevenue: 0, totalVat: 0, activeTenants: 0 });
      } else {
        const data = response.data || [];
        
        // Calculate aggregated stats
        const totalInvoices = data.length;
        const totalRevenue = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalVat = data.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
        const uniqueTenants = new Set(data.map(inv => inv.tenant_id));
        const activeTenants = uniqueTenants.size;

        setStatsData({ totalInvoices, totalRevenue, totalVat, activeTenants });
        console.log('🔥 Overview calculated:', { totalInvoices, totalRevenue, totalVat, activeTenants });
      }
    } catch (err) {
      console.error('🚨 Overview fetch error:', err);
      setStatsData({ totalInvoices: 0, totalRevenue: 0, totalVat: 0, activeTenants: 0 });
    }
  };

  const generateInvoices = async () => {
    setGenerating(true);
    
    try {
      console.log('🔥 Starting invoice generation for:', selectedMonth);
      
      // Simple test generation
      toast.success('Invoice generation test completed');
      
      // Refresh data after generation
      await fetchBillingOverview();
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
    console.log('About to call fetchBillingOverview');
    fetchBillingOverview();
    console.log('About to call fetchInvoices');
    fetchInvoices();
  }, [selectedMonth]);

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} SEK`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>Back</Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Billing Dashboard</h1>
            <p className="text-gray-600">Manage service costs, usage tracking, and invoice generation</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
          <Button onClick={generateInvoices} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Test'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalInvoices}</div>
            <p className="text-xs text-gray-500">Generated this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statsData.totalRevenue)}</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total VAT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statsData.totalVat)}</div>
            <p className="text-xs text-gray-500">Collected this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.activeTenants}</div>
            <p className="text-xs text-gray-500">With usage this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Section */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading invoices...</div>
          ) : invoiceData.length > 0 ? (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-6 gap-4 p-3 bg-gray-100 font-medium text-sm">
                <div>Invoice #</div>
                <div>Date</div>
                <div>Amount</div>
                <div>VAT</div>
                <div>Status</div>
                <div>Tenant</div>
              </div>
              {/* Invoice rows */}
              {invoiceData.map((invoice) => (
                <div key={invoice.id} className="grid grid-cols-6 gap-4 p-3 border-b hover:bg-gray-50">
                  <div className="font-medium">{invoice.invoice_number}</div>
                  <div>{invoice.invoice_date}</div>
                  <div>{formatCurrency(invoice.total_amount)}</div>
                  <div>{formatCurrency(invoice.tax_amount)}</div>
                  <div>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div>Tenant {invoice.tenant_id}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                No invoices found for {monthOptions.find(m => m.value === selectedMonth)?.label}
              </div>
              <div className="text-sm bg-blue-50 p-4 rounded max-w-md mx-auto">
                <div className="font-medium mb-2">Expected for September 2025:</div>
                <div>• 3 invoices should exist</div>
                <div>• Total: 375.00 SEK</div>
                <div>• Check console logs for query details</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDashboard;