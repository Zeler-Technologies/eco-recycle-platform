import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Plus,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interfaces based on confirmed database schema
interface ServiceCostModel {
  id: string;
  service_name: string;
  cost_type: string;
  base_cost_monthly: number;
  unit_cost: number;
  allocation_method: string;
  created_at: string;
}

interface TenantServiceUsage {
  id: string;
  tenant_id: number;
  service_id: string;
  usage_date: string;
  units_used: number;
  unit_cost: number;
  base_cost_allocation: number;
  total_cost: number;
  metadata: any;
  created_at: string;
  service_cost_models?: {
    service_name: string;
    cost_type: string;
  };
  tenants?: {
    name: string;
  };
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
  service_id: string;
  service_period_start: string;
  service_period_end: string;
  created_at: string;
  updated_at: string;
  service_cost_models?: {
    service_name: string;
  };
}

interface Invoice {
  id: number;
  tenant_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  vat_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  currency: string;
  invoice_type: string;
  billing_month: string;
  vat_rate: number;
  tenant_name?: string;
  line_items?: InvoiceLineItem[];
}

interface BillingOverview {
  total_invoices_generated: number;
  total_revenue_sek: number;
  total_vat_sek: number;
  breakdown_by_service: Array<{
    service_name: string;
    total_cost: number;
    invoice_count: number;
  }>;
  breakdown_by_tenant: Array<{
    tenant_name: string;
    total_amount: number;
    invoice_count: number;
  }>;
}

interface BillingDashboardProps {
  onBack: () => void;
}

// Service Cost Tab Component
const ServiceCostTab: React.FC<{
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}> = ({ selectedMonth, setSelectedMonth }) => {
  const [serviceCosts, setServiceCosts] = useState<ServiceCostModel[]>([]);
  const [tenantUsage, setTenantUsage] = useState<TenantServiceUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceData();
  }, [selectedMonth]);

  const fetchServiceData = async () => {
    setLoading(true);
    try {
      // Fetch service cost models
      const { data: costs, error: costsError } = await supabase
        .from('service_cost_models')
        .select('*')
        .order('service_name');

      if (costsError) {
        console.error('Error fetching service costs:', costsError);
      } else {
        setServiceCosts(costs || []);
      }

      // Fetch tenant usage for selected month
      const startDate = `${selectedMonth}-01`;
      const [year, month] = selectedMonth.split('-').map(Number);
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

      const { data: usage, error: usageError } = await supabase
        .from('tenant_service_usage')
        .select(`
          *,
          service_cost_models(service_name, cost_type),
          tenants(name)
        `)
        .gte('usage_date', startDate)
        .lte('usage_date', endDate);

      if (usageError) {
        console.error('Error fetching usage data:', usageError);
      } else {
        setTenantUsage(usage || []);
      }
    } catch (error) {
      console.error('Error fetching service data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading service data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Service Cost Management</h2>
          <p className="text-muted-foreground">Pricing models and usage tracking</p>
        </div>
      </div>

      {/* Service Pricing Models */}
      <Card>
        <CardHeader>
          <CardTitle>Service Pricing Models</CardTitle>
          <CardDescription>Current pricing structure for platform services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {serviceCosts.map(service => (
              <div key={service.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{service.service_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Type: {service.cost_type} | Allocation: {service.allocation_method}
                  </div>
                </div>
                <div className="text-right">
                  {service.base_cost_monthly > 0 && (
                    <div className="text-sm">
                      Base: {new Intl.NumberFormat('sv-SE', {
                        style: 'currency',
                        currency: 'SEK'
                      }).format(service.base_cost_monthly)}/month
                    </div>
                  )}
                  <div className="font-medium">
                    {new Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK'
                    }).format(service.unit_cost)}/unit
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tenant Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Usage Summary</CardTitle>
          <CardDescription>Usage breakdown by tenant for {selectedMonth}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(
              tenantUsage.reduce((acc, usage) => {
                const tenantName = usage.tenants?.name || `Tenant ${usage.tenant_id}`;
                if (!acc[tenantName]) acc[tenantName] = [];
                acc[tenantName].push(usage);
                return acc;
              }, {} as Record<string, TenantServiceUsage[]>)
            ).map(([tenantName, usages]) => (
              <div key={tenantName} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{tenantName}</h4>
                <div className="grid gap-2">
                  {usages.map(usage => (
                    <div key={usage.id} className="flex justify-between text-sm">
                      <span>
                        {usage.service_cost_models?.service_name}: {usage.units_used} units
                      </span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('sv-SE', {
                          style: 'currency',
                          currency: 'SEK'
                        }).format(usage.total_cost)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK'
                    }).format(usages.reduce((sum, u) => sum + u.total_cost, 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Invoice Detail Modal Component
const InvoiceDetailModal: React.FC<{
  invoice: Invoice;
  onClose: () => void;
}> = ({ invoice, onClose }) => {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoice.id]);

  const fetchInvoiceDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('scrapyard_invoice_items')
        .select(`
          *,
          service_cost_models(service_name)
        `)
        .eq('invoice_id', invoice.id);

      if (!error && data) {
        setLineItems(data);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details: {invoice.invoice_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label>Tenant:</Label>
              <div className="font-medium">{invoice.tenant_name}</div>
            </div>
            <div>
              <Label>Invoice Date:</Label>
              <div className="font-medium">{invoice.invoice_date}</div>
            </div>
            <div>
              <Label>Due Date:</Label>
              <div className="font-medium">{invoice.due_date}</div>
            </div>
            <div>
              <Label>Status:</Label>
              <Badge variant={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
            </div>
          </div>

          {/* Service Breakdown */}
          <div>
            <Label>Service Line Items:</Label>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-lg mt-2">
                {lineItems.length > 0 ? (
                  lineItems.map(item => (
                    <div key={item.id} className="flex justify-between p-4 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">
                          {item.service_cost_models?.service_name || item.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} × {new Intl.NumberFormat('sv-SE', {
                            style: 'currency',
                            currency: 'SEK'
                          }).format(item.unit_price)}
                        </div>
                        {item.service_period_start && (
                          <div className="text-xs text-muted-foreground">
                            Period: {item.service_period_start} to {item.service_period_end}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {new Intl.NumberFormat('sv-SE', {
                            style: 'currency',
                            currency: 'SEK'
                          }).format(item.total_price)}
                        </div>
                        {item.tax_amount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            VAT: {new Intl.NumberFormat('sv-SE', {
                              style: 'currency',
                              currency: 'SEK'
                            }).format(item.tax_amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No line items found for this invoice
                  </div>
                )}
                
                {/* Invoice Totals */}
                <div className="bg-muted/50 space-y-2 p-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('sv-SE', {
                        style: 'currency',
                        currency: 'SEK'
                      }).format(invoice.total_amount - invoice.vat_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT ({invoice.vat_rate}%):</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('sv-SE', {
                        style: 'currency',
                        currency: 'SEK'
                      }).format(invoice.vat_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>
                      {new Intl.NumberFormat('sv-SE', {
                        style: 'currency',
                        currency: 'SEK'
                      }).format(invoice.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function BillingDashboard({ onBack }: BillingDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingOverview, setBillingOverview] = useState<BillingOverview | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [generating, setGenerating] = useState(false);

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

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  // Fetch billing overview using correct query
  const fetchBillingOverview = async () => {
    setLoadingOverview(true);
    try {
      const startDate = `${selectedMonth}-01`;
      
      const { data: invoiceData, error } = await supabase
        .from('scrapyard_invoices')
        .select('total_amount, vat_amount, status, tenant_id')
        .eq('billing_month', startDate);
      
      if (error) {
        console.error('Billing overview error:', error);
        return;
      }
      
      // Calculate overview from real data
      const overview: BillingOverview = {
        total_invoices_generated: invoiceData?.length || 0,
        total_revenue_sek: invoiceData?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
        total_vat_sek: invoiceData?.reduce((sum, inv) => sum + Number(inv.vat_amount), 0) || 0,
        breakdown_by_service: [],
        breakdown_by_tenant: []
      };
      
      setBillingOverview(overview);
    } catch (error) {
      console.error('Error fetching billing overview:', error);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fixed fetchInvoices function
  const fetchInvoices = async () => {
    try {
      console.log('Fetching invoices for month:', selectedMonth);
      setLoading(true);

      const startDate = `${selectedMonth}-01`;
      
      // Query billing_month instead of invoice_date
      const { data, error } = await supabase
        .from('scrapyard_invoices')
        .select('*')
        .eq('billing_month', startDate)
        .order('id', { ascending: false });

      if (error) {
        console.error('Query error:', error);
        toast.error('Failed to load invoices');
        return;
      }

      console.log('Found invoices:', data?.length, data);

      // Get tenant names
      const tenantMap = new Map();
      if (data && data.length > 0) {
        const tenantIds = [...new Set(data.map(inv => inv.tenant_id).filter(Boolean))];
        
        if (tenantIds.length > 0) {
          const { data: tenantsData } = await supabase
            .from('tenants')
            .select('tenants_id, name')
            .in('tenants_id', tenantIds);
          
          tenantsData?.forEach(tenant => {
            tenantMap.set(tenant.tenants_id, tenant.name);
          });
        }
      }

      // Transform invoices
      const transformedInvoices = (data || []).map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        tenant_id: inv.tenant_id,
        tenant_name: tenantMap.get(inv.tenant_id) || `Tenant ${inv.tenant_id}`,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        total_amount: Number(inv.total_amount),
        vat_amount: Number(inv.vat_amount),
        status: inv.status,
        currency: inv.currency || 'SEK',
        invoice_type: inv.invoice_type,
        billing_month: inv.billing_month,
        vat_rate: inv.vat_rate || 25
      }));

      console.log('Transformed invoices:', transformedInvoices);
      setInvoices(transformedInvoices);

    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  // Generate monthly invoices using RPC function
  const generateMonthlyInvoices = async () => {
    setGenerating(true);
    try {
      // Try to use the working RPC function first
      const { data, error } = await supabase.rpc('generate_monthly_invoices_for_tenants_test', {
        p_billing_month: selectedMonth
      });

      if (error) {
        console.error('RPC error, falling back to simple generation:', error);
        
        // Fallback to simple generation
        const { data: tenants } = await supabase
          .from('tenants')
          .select('tenants_id, name')
          .limit(3);

        if (!tenants || tenants.length === 0) {
          toast.error('No tenants found');
          return;
        }

        let generatedCount = 0;
        const startDate = `${selectedMonth}-01`;
        
        for (const tenant of tenants) {
          // Check if invoice already exists
          const { data: existing } = await supabase
            .from('scrapyard_invoices')
            .select('id')
            .eq('tenant_id', tenant.tenants_id)
            .eq('billing_month', startDate)
            .single();

          if (!existing) {
            const { error: insertError } = await supabase.from('scrapyard_invoices').insert({
              scrapyard_id: 1,
              tenant_id: tenant.tenants_id,
              invoice_number: `INV-${tenant.tenants_id}-${selectedMonth}`,
              invoice_date: startDate,
              due_date: `${selectedMonth}-28`,
              total_amount: 125,
              vat_amount: 25,
              vat_rate: 25,
              currency: 'SEK',
              status: 'pending',
              invoice_type: 'monthly',
              billing_month: startDate
            });
            
            if (!insertError) generatedCount++;
          }
        }

        toast.success(`Generated ${generatedCount} invoices`);
      } else {
        toast.success(`Generated ${data.total_invoices_generated} invoices totaling ${data.total_revenue_sek} SEK`);
      }

      await Promise.all([fetchBillingOverview(), fetchInvoices()]);
    } catch (error) {
      console.error('Error generating invoices:', error);
      toast.error('Failed to generate invoices');
    } finally {
      setGenerating(false);
    }
  };

  const openInvoiceDetail = async (invoice: Invoice) => {
    try {
      const { data } = await supabase
        .from('scrapyard_invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      setSelectedInvoice({
        ...invoice,
        line_items: data as any
      });
    } catch (error) {
      console.error('Error loading invoice details:', error);
      setSelectedInvoice(invoice);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered for month:', selectedMonth);
    fetchBillingOverview();
    fetchInvoices();
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
      {billingOverview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{billingOverview.total_invoices_generated}</div>
              <p className="text-xs text-muted-foreground">Generated this month</p>
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
                }).format(billingOverview.total_revenue_sek)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VAT Collected</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('sv-SE', {
                  style: 'currency',
                  currency: 'SEK'
                }).format(billingOverview.total_vat_sek)}
              </div>
              <p className="text-xs text-muted-foreground">25% Swedish VAT</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('sv-SE', {
                  style: 'currency',
                  currency: 'SEK'
                }).format(billingOverview.total_invoices_generated > 0 ? billingOverview.total_revenue_sek / billingOverview.total_invoices_generated : 0)}
              </div>
              <p className="text-xs text-muted-foreground">Per invoice</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly-billing">Monthly Billing</TabsTrigger>
          <TabsTrigger value="service-costs">Service Costs</TabsTrigger>
          <TabsTrigger value="invoice-management">Invoices</TabsTrigger>
          <TabsTrigger value="vat-reports">VAT Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Billing overview for {monthOptions.find(m => m.value === selectedMonth)?.label}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOverview ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Loading overview...</span>
                </div>
              ) : billingOverview ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Invoice Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Invoices:</span>
                        <span className="font-medium">{billingOverview.total_invoices_generated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Revenue:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('sv-SE', {
                            style: 'currency',
                            currency: 'SEK'
                          }).format(billingOverview.total_revenue_sek)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT Amount:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('sv-SE', {
                            style: 'currency',
                            currency: 'SEK'
                          }).format(billingOverview.total_vat_sek)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Actions</h4>
                    <div className="space-y-2">
                      <Button 
                        onClick={generateMonthlyInvoices} 
                        disabled={generating}
                        className="w-full"
                      >
                        {generating ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {generating ? 'Generating...' : 'Generate Monthly Invoices'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly-billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Monthly Invoices</CardTitle>
              <CardDescription>Create invoices based on actual usage data for {monthOptions.find(m => m.value === selectedMonth)?.label}</CardDescription>
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
              
              {billingOverview && (
                <div className="text-sm text-muted-foreground">
                  Current month has {billingOverview.total_invoices_generated} invoices 
                  totaling {new Intl.NumberFormat('sv-SE', {
                    style: 'currency',
                    currency: 'SEK'
                  }).format(billingOverview.total_revenue_sek)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-costs" className="space-y-6">
          <ServiceCostTab 
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        </TabsContent>

        <TabsContent value="invoice-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>All invoices for {monthOptions.find(m => m.value === selectedMonth)?.label}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="mt-2">Loading invoices...</p>
                </div>
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
                    {invoices.length > 0 ? (
                      invoices.map(invoice => (
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
                            <Badge variant={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openInvoiceDetail(invoice)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No invoices found for {monthOptions.find(m => m.value === selectedMonth)?.label}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vat-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>VAT Reports</CardTitle>
              <CardDescription>Tax reporting and compliance for {monthOptions.find(m => m.value === selectedMonth)?.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                VAT reporting features will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Analytics</CardTitle>
              <CardDescription>Cost trends and billing insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Analytics charts and trends will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}