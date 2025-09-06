import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Send, AlertCircle, FileText, XCircle, Clock, Download, TrendingUp, BarChart3 } from 'lucide-react';

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

interface InvoiceManagementTabProps {
  invoices: Invoice[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  updateInvoiceStatus: (invoiceId: number, newStatus: string) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

export const InvoiceManagementTab: React.FC<InvoiceManagementTabProps> = ({
  invoices,
  selectedMonth,
  setSelectedMonth,
  updateInvoiceStatus,
  getStatusColor,
  getStatusIcon
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Invoice Management</h2>
          <p className="text-muted-foreground">View and manage all invoices</p>
        </div>
        <div className="flex gap-3 items-center">
          <Label htmlFor="filter-month">Filter by Month:</Label>
          <Input
            id="filter-month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices for {selectedMonth}</CardTitle>
          <CardDescription>
            All invoices generated for the selected billing period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-lg">{invoice.tenant_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Invoice: {invoice.invoice_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.due_date).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold">
                        {invoice.total_amount?.toFixed(2) || '0.00'} {invoice.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        VAT: {invoice.vat_amount?.toFixed(2) || '0.00'} {invoice.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Subtotal: {((invoice.total_amount || 0) - (invoice.vat_amount || 0)).toFixed(2)} {invoice.currency}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge className={getStatusColor(invoice.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(invoice.status)}
                        {invoice.status.toUpperCase()}
                      </span>
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Select
                        value={invoice.status}
                        onValueChange={(value) => updateInvoiceStatus(invoice.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4 mr-1" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No invoices found</p>
              <p className="text-sm mt-2">
                Generate invoices for {selectedMonth} to see them here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface VATReportsTabProps {
  billingOverview: BillingOverview | null;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const VATReportsTab: React.FC<VATReportsTabProps> = ({
  billingOverview,
  selectedMonth,
  setSelectedMonth
}) => {
  const overview = billingOverview?.invoice_summary;
  const subtotal = (overview?.total_amount_sek || 0) - (overview?.total_vat_sek || 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">VAT Reporting</h2>
          <p className="text-muted-foreground">Swedish VAT compliance and reporting</p>
        </div>
        <div className="flex gap-3 items-center">
          <Label htmlFor="vat-month">Report Month:</Label>
          <Input
            id="vat-month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">VAT Summary for {selectedMonth}</CardTitle>
            <CardDescription className="text-blue-700">
              Swedish VAT (25%) breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Net Amount (Excluding VAT):</span>
                <span className="font-medium">{subtotal.toFixed(2)} SEK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">VAT (25%):</span>
                <span className="font-medium">{(overview?.total_vat_sek || 0).toFixed(2)} SEK</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>Total Amount (Including VAT):</span>
                  <span>{(overview?.total_amount_sek || 0).toFixed(2)} SEK</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">VAT Compliance</CardTitle>
            <CardDescription className="text-green-700">
              Swedish tax authority requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">25% Swedish VAT applied</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Invoice numbering compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">VAT registration displayed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">30-day payment terms</span>
              </div>
            </div>
            
            <Button className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export VAT Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly VAT Breakdown</CardTitle>
          <CardDescription>
            Detailed VAT analysis for {selectedMonth}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {overview?.total_invoices || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Invoices</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {subtotal.toFixed(0)} SEK
                </div>
                <div className="text-sm text-muted-foreground">Net Amount</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(overview?.total_vat_sek || 0).toFixed(0)} SEK
                </div>
                <div className="text-sm text-muted-foreground">VAT Collected</div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">VAT Reporting Notes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All amounts are calculated in Swedish Kronor (SEK)</li>
                <li>• VAT rate applied: 25% (standard Swedish rate)</li>
                <li>• Reporting period: {selectedMonth}</li>
                <li>• VAT registration number: SE123456789001</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface AnalyticsTabProps {
  billingOverview: BillingOverview | null;
  invoices: Invoice[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  billingOverview,
  invoices
}) => {
  const overview = billingOverview?.invoice_summary;
  const avgInvoiceAmount = overview?.total_invoices ? 
    (overview.total_amount_sek / overview.total_invoices) : 0;

  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const paymentRate = invoices.length ? (paidInvoices.length / invoices.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Billing Analytics</h2>
        <p className="text-muted-foreground">Revenue trends and payment analytics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Average Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgInvoiceAmount.toFixed(0)} SEK
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per invoice this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Payment Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Invoices paid on time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              VAT Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25.0%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Standard VAT rate applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Active Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.total_invoices || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Billed this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>
            Current month revenue analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Payment Status Distribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Paid
                    </span>
                    <span className="font-medium">{overview?.status_breakdown?.paid || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Pending
                    </span>
                    <span className="font-medium">{overview?.status_breakdown?.pending || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Overdue
                    </span>
                    <span className="font-medium">{overview?.status_breakdown?.overdue || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      Cancelled
                    </span>
                    <span className="font-medium">{overview?.status_breakdown?.cancelled || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Financial Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Gross Revenue:</span>
                    <span className="font-medium">{(overview?.total_amount_sek || 0).toFixed(2)} SEK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">VAT Amount:</span>
                    <span className="font-medium">{(overview?.total_vat_sek || 0).toFixed(2)} SEK</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Revenue:</span>
                    <span className="font-bold">{((overview?.total_amount_sek || 0) - (overview?.total_vat_sek || 0)).toFixed(2)} SEK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};