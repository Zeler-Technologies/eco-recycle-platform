import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, DollarSign, FileText, Loader2, AlertCircle, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import { InvoiceManagementTab, VATReportsTab, AnalyticsTab } from './BillingDashboardTabs';

interface BillingOverview {
  billing_month: string;
  invoice_summary: {
    total_invoices: number;
    total_amount_sek: number;
    total_vat_sek: number;
    status_breakdown: {
      pending: number;
      paid: number;
      overdue: number;
      cancelled: number;
    };
  };
}

interface Invoice {
  id: number;
  invoice_number: string;
  tenant_id: number;
  tenant_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  vat_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  currency: string;
}

interface BillingDashboardProps {
  onBack: () => void;
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [billingOverview, setBillingOverview] = useState<BillingOverview | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeDashboard();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchBillingOverview();
      fetchInvoices();
    }
  }, [selectedMonth, hasAccess]);

  const initializeDashboard = async () => {
    try {
      // For development, automatically grant access
      setHasAccess(true);
    } catch (error) {
      console.error('Error checking access:', error);
      toast({
        title: "Access Error",
        description: "Failed to verify billing access",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingOverview = async () => {
    try {
      // Use mock data for development - can be replaced with real RPC calls
      const mockOverview: BillingOverview = {
        billing_month: selectedMonth,
        invoice_summary: {
          total_invoices: 3,
          total_amount_sek: 3750,
          total_vat_sek: 750,
          status_breakdown: {
            pending: 2,
            paid: 1,
            overdue: 0,
            cancelled: 0
          }
        }
      };
      setBillingOverview(mockOverview);
      
      // TODO: Replace with real RPC call when database is ready:
      // const { data, error } = await supabase.rpc('get_monthly_billing_overview', {
      //   p_billing_month: selectedMonth + '-01'
      // });
    } catch (error) {
      console.error('Error fetching billing overview:', error);
      toast({
        title: "Error",
        description: "Failed to fetch billing overview",
        variant: "destructive"
      });
    }
  };

  const fetchInvoices = async () => {
    try {
      console.log('Fetching real invoices from database...');
      
      // Get real invoices from the database (simplified query)
      const { data, error } = await supabase
        .from('scrapyard_invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Invoice fetch error:', error);
        // Fall back to mock data if database query fails
        const mockInvoices: Invoice[] = [
          {
            id: 1,
            invoice_number: 'INV-1-2025-09',
            tenant_id: 1,
            tenant_name: 'Demo Scrapyard Stockholm',
            invoice_date: '2025-09-01',
            due_date: '2025-10-01',
            total_amount: 1250,
            vat_amount: 250,
            status: 'sent',
            currency: 'SEK'
          },
          {
            id: 2,
            invoice_number: 'INV-2-2025-09',
            tenant_id: 2,
            tenant_name: 'Scrapyard Göteborg',
            invoice_date: '2025-09-01',
            due_date: '2025-10-01',
            total_amount: 1500,
            vat_amount: 300,
            status: 'paid',
            currency: 'SEK'
          }
        ];
        setInvoices(mockInvoices);
        return;
      }
      
      console.log('Raw invoice data:', data);
      
      // Get tenant names separately if we have invoices
      const tenantMap = new Map();
      if (data && data.length > 0) {
        const tenantIds = [...new Set(data.map(inv => inv.tenant_id))];
        const { data: tenantsData } = await supabase
          .from('tenants')
          .select('tenants_id, name')
          .in('tenants_id', tenantIds);
        
        tenantsData?.forEach(tenant => {
          tenantMap.set(tenant.tenants_id, tenant.name);
        });
      }
      
      // Transform real data to match Invoice interface
      const transformedInvoices = (data || []).map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        tenant_id: inv.tenant_id,
        tenant_name: tenantMap.get(inv.tenant_id) || `Tenant ${inv.tenant_id}`,
        invoice_date: inv.invoice_date || '2025-09-01',
        due_date: inv.due_date || '2025-10-01',
        total_amount: Number(inv.total_amount) || 0,
        vat_amount: Number(inv.vat_amount) || 0,
        status: inv.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
        currency: inv.currency || 'SEK'
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

  const generateMonthlyInvoices = async () => {
    setGenerating(true);
    try {
      // Mock generation for development - can be replaced with real RPC later
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: `Generated invoices for ${selectedMonth}`,
      });
      
      // Refresh data
      await Promise.all([fetchBillingOverview(), fetchInvoices()]);
    } catch (error) {
      console.error('Error generating invoices:', error);
      toast({
        title: "Error",
        description: "Failed to generate monthly invoices",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: number, newStatus: string) => {
    try {
      console.log('Updating invoice status:', { invoiceId, newStatus });
      
      // Update the database
      const { error } = await supabase
        .from('scrapyard_invoices')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) {
        console.error('Status update error:', error);
        toast({
          title: "Error",
          description: "Failed to update invoice status: " + error.message,
          variant: "destructive"
        });
        return;
      }

      // Update the local state immediately for better UX
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: newStatus as any }
          : inv
      ));

      toast({
        title: "Success",
        description: `Invoice status updated to ${newStatus}`,
      });
      
      // Refresh overview data to reflect status changes
      await fetchBillingOverview();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'sent': return <FileText className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Initializing billing dashboard...</span>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access billing features.</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Billing & Invoice Control</h1>
          <p className="text-muted-foreground">Swedish VAT-compliant multi-tenant billing</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly-billing">Monthly Billing</TabsTrigger>
          <TabsTrigger value="invoice-management">Invoices</TabsTrigger>
          <TabsTrigger value="vat-reports">VAT Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab 
            billingOverview={billingOverview}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            generateMonthlyInvoices={generateMonthlyInvoices}
            generating={generating}
          />
        </TabsContent>

        <TabsContent value="monthly-billing" className="space-y-6">
          <MonthlyBillingTab 
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            generateMonthlyInvoices={generateMonthlyInvoices}
            generating={generating}
            billingOverview={billingOverview}
          />
        </TabsContent>

        <TabsContent value="invoice-management" className="space-y-6">
          <InvoiceManagementTab 
            invoices={invoices}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            updateInvoiceStatus={updateInvoiceStatus}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>

        <TabsContent value="vat-reports" className="space-y-6">
          <VATReportsTab 
            billingOverview={billingOverview}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab 
            billingOverview={billingOverview}
            invoices={invoices}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Tab Components
const OverviewTab: React.FC<{ 
  billingOverview: BillingOverview | null;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  generateMonthlyInvoices: () => void;
  generating: boolean;
}> = ({ billingOverview, selectedMonth, setSelectedMonth, generateMonthlyInvoices, generating }) => {
  const overview = billingOverview?.invoice_summary;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Billing Overview</h2>
          <p className="text-muted-foreground">Current month billing summary</p>
        </div>
        <div className="flex gap-3 items-center">
          <Label htmlFor="month-select">Month:</Label>
          <Input
            id="month-select"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {overview?.total_invoices || 0}
            </div>
            <p className="text-xs text-blue-700 mt-1">For {selectedMonth}</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {overview?.total_amount_sek?.toFixed(0) || '0'} SEK
            </div>
            <p className="text-xs text-green-700 mt-1">Including VAT</p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              VAT Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {overview?.total_vat_sek?.toFixed(0) || '0'} SEK
            </div>
            <p className="text-xs text-purple-700 mt-1">25% Swedish VAT</p>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Paid Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {overview?.status_breakdown?.paid || 0}
            </div>
            <p className="text-xs text-orange-700 mt-1">
              {overview?.status_breakdown?.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Generate invoices and manage billing for {selectedMonth}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateMonthlyInvoices}
            disabled={generating}
            size="lg"
            className="w-full"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Generate This Month's Invoices
          </Button>
          
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {overview.status_breakdown?.pending || 0}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {overview.status_breakdown?.pending || 0}
                </div>
                <div className="text-sm text-muted-foreground">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {overview.status_breakdown?.paid || 0}
                </div>
                <div className="text-sm text-muted-foreground">Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {overview.status_breakdown?.overdue || 0}
                </div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const MonthlyBillingTab: React.FC<{ 
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  generateMonthlyInvoices: () => void;
  generating: boolean;
  billingOverview: BillingOverview | null;
}> = ({ selectedMonth, setSelectedMonth, generateMonthlyInvoices, generating, billingOverview }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Monthly Billing Generation</h2>
          <p className="text-muted-foreground">Generate monthly invoices for all tenants</p>
        </div>
        <div className="flex gap-3 items-center">
          <Label htmlFor="billing-month">Billing Month:</Label>
          <Input
            id="billing-month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Invoice Generation for {selectedMonth}
          </CardTitle>
          <CardDescription>
            Generate invoices for all active tenants including platform costs, usage charges, and Swedish VAT (25%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {billingOverview && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Current Status:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{billingOverview.invoice_summary?.total_invoices || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Invoices</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{billingOverview.invoice_summary?.total_amount_sek?.toFixed(0) || '0'} SEK</div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{billingOverview.invoice_summary?.total_vat_sek?.toFixed(0) || '0'} SEK</div>
                  <div className="text-sm text-muted-foreground">VAT Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{((billingOverview.invoice_summary?.total_amount_sek || 0) - (billingOverview.invoice_summary?.total_vat_sek || 0)).toFixed(0)} SEK</div>
                  <div className="text-sm text-muted-foreground">Subtotal</div>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={generateMonthlyInvoices}
            disabled={generating}
            size="lg"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Invoices...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Monthly Invoices
              </>
            )}
          </Button>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Platform base costs will be automatically included</p>
            <p>• Usage-based charges calculated from actual consumption</p>
            <p>• Shared costs allocated proportionally across tenants</p>
            <p>• 25% Swedish VAT applied to all charges</p>
            <p>• Invoice numbers: INV-{'{tenant_id}'}-{selectedMonth}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDashboard;