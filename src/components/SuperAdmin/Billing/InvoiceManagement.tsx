import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Eye, 
  Send, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  Building2,
  DollarSign,
  Percent
} from 'lucide-react';

interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  invoiceNumber: string;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  lineItems: LineItem[];
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  total: number;
  margin: number;
}

export const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      tenantId: 'tenant_001',
      tenantName: 'Panta Bilen Stockholm',
      invoiceNumber: 'INV-2024-001',
      billingPeriod: 'January 2024',
      issueDate: '2024-01-31',
      dueDate: '2024-02-15',
      status: 'paid',
      subtotal: 2450.00,
      tax: 367.50,
      total: 2817.50,
      lineItems: [
        {
          id: '1',
          description: 'Monthly Service Fee',
          quantity: 1,
          unitCost: 50.00,
          unitPrice: 100.00,
          total: 100.00,
          margin: 50.00
        },
        {
          id: '2',
          description: 'Car Processing (1,200 cars)',
          quantity: 1200,
          unitCost: 0.08,
          unitPrice: 0.12,
          total: 144.00,
          margin: 48.00
        }
      ]
    },
    {
      id: '2',
      tenantId: 'tenant_002',
      tenantName: 'Oslo Scrap Yard',
      invoiceNumber: 'INV-2024-002',
      billingPeriod: 'January 2024',
      issueDate: '2024-01-31',
      dueDate: '2024-02-15',
      status: 'overdue',
      subtotal: 890.00,
      tax: 133.50,
      total: 1023.50,
      lineItems: [
        {
          id: '1',
          description: 'Monthly Service Fee',
          quantity: 1,
          unitCost: 50.00,
          unitPrice: 75.00,
          total: 75.00,
          margin: 25.00
        }
      ]
    }
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesSearch = invoice.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-status-completed text-white';
      case 'sent': return 'bg-status-processing text-white';
      case 'overdue': return 'bg-status-cancelled text-white';
      case 'draft': return 'bg-status-pending text-white';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'sent': return 'Sent';
      case 'overdue': return 'Overdue';
      case 'draft': return 'Draft';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const generateInvoice = (tenantId: string) => {
    // Mock invoice generation logic
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      tenantId,
      tenantName: 'New Tenant',
      invoiceNumber: `INV-2024-${invoices.length + 1}`.padStart(3, '0'),
      billingPeriod: 'February 2024',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      subtotal: 0,
      tax: 0,
      total: 0,
      lineItems: []
    };
    setInvoices(prev => [...prev, newInvoice]);
  };

  const InvoiceDetails = ({ invoice }: { invoice: Invoice }) => {
    const totalMargin = invoice.lineItems.reduce((sum, item) => sum + item.margin, 0);
    const marginPercentage = invoice.subtotal > 0 ? (totalMargin / invoice.subtotal) * 100 : 0;

    return (
      <div className="space-y-6">
        {/* Invoice Header */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Invoice Details</h3>
            <div className="space-y-2">
              <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
              <p><strong>Tenant:</strong> {invoice.tenantName}</p>
              <p><strong>Period:</strong> {invoice.billingPeriod}</p>
              <p><strong>Issue Date:</strong> {invoice.issueDate}</p>
              <p><strong>Due Date:</strong> {invoice.dueDate}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="space-y-2">
              <p><strong>Subtotal:</strong> €{invoice.subtotal.toFixed(2)}</p>
              <p><strong>Tax:</strong> €{invoice.tax.toFixed(2)}</p>
              <p><strong>Total:</strong> €{invoice.total.toFixed(2)}</p>
              <p><strong>Margin:</strong> €{totalMargin.toFixed(2)} ({marginPercentage.toFixed(1)}%)</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Line Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>€{item.unitCost.toFixed(2)}</TableCell>
                  <TableCell>€{item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>€{item.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className="bg-status-completed text-white">
                      €{item.margin.toFixed(2)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
          <Button className="bg-admin-primary hover:bg-admin-primary/90">
            <FileText className="h-4 w-4 mr-2" />
            Edit Invoice
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-admin-primary">Invoice Management</h2>
          <p className="text-muted-foreground">Generate, preview, and manage tenant invoices</p>
        </div>
        <Button 
          className="bg-admin-primary hover:bg-admin-primary/90"
          onClick={() => generateInvoice('tenant_new')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate Invoice
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-custom-sm">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card className="bg-white shadow-custom-sm">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Manage and track all tenant invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.tenantName}</TableCell>
                  <TableCell>{invoice.billingPeriod}</TableCell>
                  <TableCell>{invoice.issueDate}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>
                      {getStatusText(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>€{invoice.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Invoice Details - {invoice.invoiceNumber}</DialogTitle>
                          <DialogDescription>
                            View and manage invoice for {invoice.tenantName}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedInvoice && <InvoiceDetails invoice={selectedInvoice} />}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};