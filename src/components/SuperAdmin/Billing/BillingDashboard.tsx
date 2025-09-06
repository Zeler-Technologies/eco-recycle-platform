import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, FileText, Calendar, DollarSign } from 'lucide-react';

interface Invoice {
  id: number;
  invoice_number: string;
  tenant_id: number;
  tenant_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  tax_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
}

interface Tenant {
  tenants_id: number;
  name: string;
  country: string;
}

const BillingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchTenants()]).finally(() => setLoading(false));
  }, [selectedMonth]);

  const fetchInvoices = async () => {
    try {
      console.log('Fetching invoices for month:', selectedMonth);
      
      // Use the exact date format from the billing_month column
      const monthStart = `${selectedMonth}-01`;
      
      const { data, error } = await supabase
        .from('scrapyard_invoices')
        .select(`
          id,
          invoice_number,
          tenant_id,
          invoice_date,
          due_date,
          total_amount,
          tax_amount,
          status,
          tenants!inner(name)
        `)
        .gte('invoice_date', monthStart)
        .lt('invoice_date', new Date(new Date(monthStart).getFullYear(), new Date(monthStart).getMonth() + 1, 1).toISOString())
        .order('invoice_date', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      console.log('Raw invoice data:', data);

      const transformedInvoices: Invoice[] = (data || []).map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        tenant_id: invoice.tenant_id,
        tenant_name: (invoice.tenants as any)?.name || 'Unknown',
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        total_amount: invoice.total_amount,
        tax_amount: invoice.tax_amount,
        status: invoice.status as 'pending' | 'paid' | 'overdue' | 'cancelled'
      }));

      console.log('Transformed invoices:', transformedInvoices);
      setInvoices(transformedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive"
      });
    }
  };

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('tenants_id, name, country')
        .order('name');
      
      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const getTotalRevenue = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  };

  const getTotalTax = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.tax_amount, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing Dashboard</h1>
          <p className="text-muted-foreground">Manage invoices and billing for all tenants</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Label htmlFor="month-select">Select Month:</Label>
        <Input
          id="month-select"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-48"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoices.length}</div>
                <p className="text-xs text-muted-foreground">
                  For {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalRevenue().toFixed(2)} SEK</div>
                <p className="text-xs text-muted-foreground">
                  +{getTotalTax().toFixed(2)} SEK tax
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenants.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total registered tenants
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoices for {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
              <CardDescription>
                {invoices.length} invoices found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No invoices found for this month</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{invoice.invoice_number}</h3>
                          <p className="text-sm text-muted-foreground">{invoice.tenant_name}</p>
                        </div>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Invoice Date:</span>
                          <p>{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Due Date:</span>
                          <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <p className="font-semibold">{invoice.total_amount.toFixed(2)} SEK</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tax:</span>
                          <p>{invoice.tax_amount.toFixed(2)} SEK</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingDashboard;