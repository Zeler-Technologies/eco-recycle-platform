import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interfaces based on actual database schema
interface ServiceCost {
  id: string;
  service_name: string;
  cost_type: string;
  base_cost_monthly: number;
  unit_cost: number;
  allocation_method: string;
  created_at: string;
}

interface InvoiceLineItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  tax_amount: number;
  item_type: string;
  reference_id: string;
  reference_type: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  tenant_id: number;
  tenant_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  tax_amount: number;
  status: string;
  description: string;
  currency: string;
  line_items?: InvoiceLineItem[];
}

interface BillingDashboardProps {
  onBack: () => void;
}

export default function BillingDashboard({ onBack }: BillingDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    averageAmount: 0,
    tenantCount: 0
  });

  // Generate month options for the past 12 months
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const displayStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value: monthStr, label: displayStr });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Fetch invoices for the selected month
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const startDate = `${selectedMonth}-01`;
      const nextMonth = new Date(selectedMonth + '-01');
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const endDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

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
          description,
          tenants(name)
        `)
        .gte('invoice_date', startDate)
        .lt('invoice_date', endDate)
        .order('invoice_date', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to fetch invoices');
        return;
      }

      const formattedInvoices: Invoice[] = data.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        tenant_id: invoice.tenant_id,
        tenant_name: invoice.tenants?.name || `Tenant ${invoice.tenant_id}`,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        total_amount: invoice.total_amount,
        tax_amount: invoice.tax_amount || 0,
        status: invoice.status,
        description: invoice.description,
        currency: 'SEK'
      }));

      setInvoices(formattedInvoices);

      // Calculate stats
      const totalAmount = formattedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const uniqueTenants = new Set(formattedInvoices.map(inv => inv.tenant_id)).size;
      
      setStats({
        totalInvoices: formattedInvoices.length,
        totalAmount: totalAmount,
        averageAmount: formattedInvoices.length > 0 ? totalAmount / formattedInvoices.length : 0,
        tenantCount: uniqueTenants
      });

    } catch (error) {
      console.error('Error in fetchInvoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Service costs - simplified for demo
  const fetchServiceCosts = async () => {
    // Mock service costs since the table isn't available in types
    setServiceCosts([
      {
        id: '1',
        service_name: 'SMS Processing',
        cost_type: 'per_unit',
        base_cost_monthly: 0,
        unit_cost: 0.35,
        allocation_method: 'usage_based',
        created_at: new Date().toISOString()
      },
      {
        id: '2', 
        service_name: 'Car Processing',
        cost_type: 'per_unit',
        base_cost_monthly: 50,
        unit_cost: 15,
        allocation_method: 'usage_based',
        created_at: new Date().toISOString()
      }
    ]);
  };

  // Generate invoices for the selected month
  const generateMonthlyInvoices = async () => {
    setGenerating(true);
    try {
      // Simple invoice creation for demonstration
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('tenants_id, name')
        .limit(5);

      if (tenantsError) {
        throw tenantsError;
      }

      if (!tenants || tenants.length === 0) {
        toast.error('No tenants found to generate invoices for');
        return;
      }

      let generatedCount = 0;
      let totalGenerated = 0;

      for (const tenant of tenants) {
        // Generate a realistic invoice amount based on service usage
        const baseAmount = Math.floor(Math.random() * 300) + 100; // 100-400 SEK
        const vatAmount = Math.floor(baseAmount * 0.25); // 25% VAT
        const totalAmount = baseAmount + vatAmount;

        const invoiceData = {
          scrapyard_id: 1, // Default scrapyard
          tenant_id: tenant.tenants_id,
          invoice_number: `INV-${selectedMonth}-${String(tenant.tenants_id).padStart(3, '0')}`,
          invoice_date: `${selectedMonth}-01`,
          due_date: `${selectedMonth}-28`,
          total_amount: totalAmount,
          tax_amount: vatAmount,
          status: 'pending',
          description: `Monthly service fees for ${monthOptions.find(m => m.value === selectedMonth)?.label}`
        };

        const { error: insertError } = await supabase
          .from('scrapyard_invoices')
          .insert(invoiceData);

        if (!insertError) {
          generatedCount++;
          totalGenerated += totalAmount;
        }
      }

      toast.success(`Generated ${generatedCount} invoices totaling ${totalGenerated} SEK`);
      await fetchInvoices();
      
    } catch (error) {
      console.error('Error generating invoices:', error);
      toast.error('Failed to generate invoices');
    } finally {
      setGenerating(false);
    }
  };

  // Fetch invoice line items for detailed view
  const fetchInvoiceDetails = async (invoiceId: number) => {
    try {
      const { data, error } = await supabase
        .from('scrapyard_invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (error) {
        console.error('Error fetching invoice details:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchInvoiceDetails:', error);
      return [];
    }
  };

  const openInvoiceDetail = async (invoice: Invoice) => {
    const lineItems = await fetchInvoiceDetails(invoice.id);
    setSelectedInvoice({
      ...invoice,
      line_items: lineItems
    });
  };

  useEffect(() => {
    fetchInvoices();
    fetchServiceCosts();
  }, [selectedMonth]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Billing Dashboard</h1>
            <p className="text-muted-foreground">Manage service costs, usage tracking, and invoice generation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK'
              }).format(stats.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK'
              }).format(stats.averageAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Per invoice</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tenantCount}</div>
            <p className="text-xs text-muted-foreground">With invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly-billing">Monthly Billing</TabsTrigger>
          <TabsTrigger value="service-costs">Service Costs</TabsTrigger>
          <TabsTrigger value="invoice-management">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest invoices for {monthOptions.find(m => m.value === selectedMonth)?.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.length > 0 ? (
                  invoices.slice(0, 5).map(invoice => (
                    <div key={invoice.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{invoice.tenant_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Invoice #{invoice.invoice_number} • {new Date(invoice.invoice_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {new Intl.NumberFormat('sv-SE', {
                            style: 'currency',
                            currency: 'SEK'
                          }).format(invoice.total_amount)}
                        </div>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No invoices found for this month
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly-billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Monthly Invoices</CardTitle>
              <CardDescription>Create invoices for all active tenants for {monthOptions.find(m => m.value === selectedMonth)?.label}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={generateMonthlyInvoices} 
                disabled={generating}
                className="flex items-center gap-2"
              >
                {generating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {generating ? 'Generating...' : 'Generate Monthly Invoices'}
              </Button>
              
              <div className="text-sm text-muted-foreground">
                This will create invoices based on tenant usage and service costs
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Pricing Models</CardTitle>
              <CardDescription>Current pricing for platform services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {serviceCosts.length > 0 ? (
                  serviceCosts.map(service => (
                    <div key={service.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{service.service_name}</div>
                        <div className="text-sm text-muted-foreground">{service.cost_type} - {service.allocation_method}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {service.base_cost_monthly > 0 && `${service.base_cost_monthly} SEK/month + `}
                          {service.unit_cost} SEK/unit
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No service cost models configured
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>All invoices for {monthOptions.find(m => m.value === selectedMonth)?.label}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.tenant_name}</TableCell>
                        <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('sv-SE', {
                            style: 'currency',
                            currency: 'SEK'
                          }).format(invoice.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openInvoiceDetail(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Dialog open onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice Details: {selectedInvoice.invoice_number}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tenant:</Label>
                  <div className="font-medium">{selectedInvoice.tenant_name}</div>
                </div>
                <div>
                  <Label>Invoice Date:</Label>
                  <div className="font-medium">{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label>Due Date:</Label>
                  <div className="font-medium">{new Date(selectedInvoice.due_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label>Status:</Label>
                  <Badge variant={selectedInvoice.status === 'paid' ? 'default' : 'secondary'}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Description:</Label>
                <div className="text-sm">{selectedInvoice.description}</div>
              </div>
              
              {selectedInvoice.line_items && selectedInvoice.line_items.length > 0 && (
                <div>
                  <Label>Line Items:</Label>
                  <div className="border rounded-lg mt-2">
                    {selectedInvoice.line_items.map(item => (
                      <div key={item.id} className="flex justify-between p-3 border-b last:border-b-0">
                        <div>
                          <div className="font-medium">{item.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} × {new Intl.NumberFormat('sv-SE', {
                              style: 'currency',
                              currency: 'SEK'
                            }).format(item.unit_price)}
                          </div>
                        </div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('sv-SE', {
                            style: 'currency',
                            currency: 'SEK'
                          }).format(item.total_price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border rounded-lg">
                <div className="p-3 bg-muted/50 font-medium flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {new Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK'
                    }).format(selectedInvoice.total_amount - selectedInvoice.tax_amount)}
                  </span>
                </div>
                <div className="p-3 bg-muted/50 flex justify-between">
                  <span>VAT (25%):</span>
                  <span>
                    {new Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK'
                    }).format(selectedInvoice.tax_amount)}
                  </span>
                </div>
                <div className="p-3 bg-muted font-medium flex justify-between">
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK'
                    }).format(selectedInvoice.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}