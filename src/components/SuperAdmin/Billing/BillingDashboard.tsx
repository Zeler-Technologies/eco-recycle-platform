import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, DollarSignIcon, FileTextIcon, TrendingUpIcon, AlertCircleIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interface matching exact database schema
interface Invoice {
  id: number;
  scrapyard_id: number | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  tax_amount: number;
  status: string;
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  description: string | null;
  billing_address: string | null;
  billing_postal_code: string | null;
  billing_city: string | null;
  invoice_items: any | null;
  tenant_id: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  billing_month: string;
  vat_rate: number;
  vat_amount: number;
  currency: string;
  invoice_type: string;
}

interface BillingOverview {
  totalInvoices: number;
  totalRevenue: number;
  totalVat: number;
  averageInvoiceAmount: number;
}

// Simple inline ServiceCostTab component
const ServiceCostTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Service Cost Overview</CardTitle>
          <CardDescription>
            Service costs and usage metrics will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will show service usage, cost breakdown, and analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Simple inline InvoiceDetailModal component
const InvoiceDetailModal: React.FC<{ 
  invoice: InvoiceData | null; 
  isOpen: boolean; 
  onClose: () => void; 
}> = ({ invoice, isOpen, onClose }) => {
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invoice Details - {invoice.invoice_number}</DialogTitle>
          <DialogDescription>
            Complete invoice information and details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">Invoice Information</h4>
              <p>Amount: {invoice.total_amount} SEK</p>
              <p>Tax: {invoice.tax_amount} SEK</p>
              <p>Status: <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>{invoice.status}</Badge></p>
            </div>
            <div>
              <h4 className="font-semibold">Dates</h4>
              <p>Invoice Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
              <p>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
          </div>
          {invoice.description && (
            <div>
              <h4 className="font-semibold">Description</h4>
              <p>{invoice.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BillingDashboard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('2025-09');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [billingOverview, setBillingOverview] = useState<BillingOverview | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    return { value, label };
  });

  const fetchBillingOverview = async () => {
    console.log('🔥 fetchBillingOverview STARTED for month:', selectedMonth);
    const startDate = `${selectedMonth}-01`;
    console.log('🔥 Overview querying billing_month:', startDate);
    
    try {
      const { data, error } = await supabase
        .from('scrapyard_invoices')
        .select('total_amount, tax_amount')
        .eq('billing_month', startDate);

      console.log('🔥 Supabase overview result:', { 
        error, 
        dataLength: data?.length, 
        sample: data?.[0] 
      });

      if (error) {
        console.error('🚨 Overview query error:', error);
        return;
      }

      if (data && data.length > 0) {
        const totalInvoices = data.length;
        const totalRevenue = data.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
        const totalVat = data.reduce((sum, invoice) => sum + (invoice.tax_amount || 0), 0);
        const averageInvoiceAmount = totalRevenue / totalInvoices;

        setBillingOverview({
          totalInvoices,
          totalRevenue,
          totalVat,
          averageInvoiceAmount,
        });
        console.log('🔥 Overview calculated:', { totalInvoices, totalRevenue, totalVat });
      } else {
        setBillingOverview({
          totalInvoices: 0,
          totalRevenue: 0,
          totalVat: 0,
          averageInvoiceAmount: 0,
        });
        console.log('🔥 No overview data found');
      }
    } catch (err) {
      console.error('🚨 Overview fetch error:', err);
    }
  };

  const fetchInvoices = async () => {
    console.log('🔥 fetchInvoices STARTED for month:', selectedMonth);
    setLoading(true);

    const startDate = `${selectedMonth}-01`;
    console.log('🔥 Invoices querying billing_month:', startDate);
    
    try {
      const { data, error } = await supabase
        .from('scrapyard_invoices')
        .select('*')
        .eq('billing_month', startDate)
        .order('id', { ascending: false });

      console.log('🔥 Supabase invoices result:', { 
        error, 
        dataLength: data?.length, 
        sample: data?.[0] 
      });

      if (error) {
        console.error('🚨 Invoices query error:', error);
        toast.error('Failed to fetch invoices: ' + error.message);
      } else {
        setInvoices(data || []);
        console.log('🔥 Invoices set to state:', data?.length || 0);
      }
    } catch (err) {
      console.error('🚨 Invoices fetch error:', err);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyInvoices = async () => {
    setGenerating(true);
    
    try {
      console.log('🔥 Starting invoice generation for:', selectedMonth);
      
      // Simple test - just try to fetch tenants first
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('tenants_id, name')
        .limit(1);
      
      console.log('🔥 Tenants result:', { tenants, tenantError });
      
      if (tenantError) {
        console.error('🚨 Tenant fetch failed:', tenantError);
        toast.error('Failed to fetch tenants: ' + tenantError.message);
        return;
      }
      
      console.log('✅ Generation completed successfully');
      toast.success('Test completed - check console for details');
      
      // Refresh the data after generation
      await fetchBillingOverview();
      await fetchInvoices();
      
    } catch (error) {
      console.error('🚨 Generation error:', error);
      toast.error('Generation failed: ' + (error as Error).message);
    } finally {
      console.log('🔥 Setting generating to false');
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

  const handleViewInvoice = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

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
          <Button 
            onClick={generateMonthlyInvoices} 
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Monthly Invoices'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {billingOverview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{billingOverview.totalInvoices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(billingOverview.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total VAT</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(billingOverview.totalVat)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(billingOverview.averageInvoiceAmount)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="service-costs">Service Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
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
                      <TableHead>Actions</TableHead>
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
                          {formatCurrency(invoice.tax_amount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            View Details
                          </Button>
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
                  <Button onClick={generateMonthlyInvoices} disabled={generating}>
                    {generating ? 'Generating...' : 'Generate Invoices'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-costs">
          <ServiceCostTab />
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};

// CRITICAL: Export as default to fix the import error
export default BillingDashboard;