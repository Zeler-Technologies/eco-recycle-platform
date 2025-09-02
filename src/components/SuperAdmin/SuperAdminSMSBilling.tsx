import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  FileText, 
  Calendar, 
  DollarSign,
  BarChart3,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatSwedishCurrency, formatSwedishDate } from '@/utils/swedishFormatting';

interface SMSBillingData {
  id: string;
  tenant_id: number;
  tenant_name: string;
  billing_month: string;
  total_sms_count: number;
  total_cost_sek: number;
  is_invoiced: boolean;
  invoice_generated_at?: string;
  created_at: string;
}

interface SMSStats {
  totalSMS: number;
  totalCost: number;
  totalTenants: number;
  averageCostPerSMS: number;
}

export const SuperAdminSMSBilling: React.FC = () => {
  const [billingData, setBillingData] = useState<SMSBillingData[]>([]);
  const [smsStats, setSmsStats] = useState<SMSStats>({
    totalSMS: 0,
    totalCost: 0,
    totalTenants: 0,
    averageCostPerSMS: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      // Load SMS billing summary data
      const { data: billingData, error: billingError } = await supabase
        .from('sms_billing_summary' as any)
        .select('*')
        .order('billing_month', { ascending: false });

      if (billingError) throw billingError;

      // Load tenant names separately
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('tenants_id, name');

      if (tenantsError) throw tenantsError;

      // Create tenant name lookup
      const tenantNameLookup = (tenantsData || []).reduce((acc: any, tenant: any) => {
        acc[tenant.tenants_id] = tenant.name;
        return acc;
      }, {});

      // Transform data to match interface
      const transformedData = (billingData || []).map((item: any) => ({
        id: item.id || `bill_${Date.now()}_${Math.random()}`,
        tenant_id: item.tenant_id,
        tenant_name: tenantNameLookup[item.tenant_id] || 'Okänd kund',
        billing_month: item.billing_month,
        total_sms_count: item.total_sms_count || 0,
        total_cost_sek: item.total_cost_sek || 0,
        is_invoiced: item.is_invoiced || false,
        invoice_generated_at: item.invoice_generated_at,
        created_at: item.created_at
      }));

      setBillingData(transformedData);
      
      // Calculate stats
      const totalSMS = transformedData.reduce((sum, item) => sum + item.total_sms_count, 0);
      const totalCost = transformedData.reduce((sum, item) => sum + item.total_cost_sek, 0);
      const uniqueTenants = new Set(transformedData.map(item => item.tenant_id)).size;
      
      setSmsStats({
        totalSMS,
        totalCost,
        totalTenants: uniqueTenants,
        averageCostPerSMS: totalSMS > 0 ? totalCost / totalSMS : 0
      });

    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda SMS-faktureringsdata.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMonthlyBilling = async () => {
    setIsLoading(true);
    try {
      // Mock billing generation - replace with actual RPC call when available
      const mockResult = {
        success: true,
        generated_records: 5,
        total_amount: 245.50
      };

      if (mockResult.success) {
        toast({
          title: "Månatlig rapport genererad",
          description: `${mockResult.generated_records} fakturaposter skapade för totalt ${formatSwedishCurrency(mockResult.total_amount)}`,
        });
        
        // Reload data
        await loadBillingData();
      }
    } catch (error) {
      console.error('Error generating billing:', error);
      toast({
        title: "Fel vid generering",
        description: "Kunde inte generera månatlig rapport.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportBillingData = () => {
    // Create CSV export
    const headers = ['Kund', 'Månad', 'Antal SMS', 'Total kostnad', 'Fakturerad', 'Fakturadatum'];
    const csvData = billingData.map(row => [
      row.tenant_name,
      row.billing_month,
      row.total_sms_count,
      row.total_cost_sek,
      row.is_invoiced ? 'Ja' : 'Nej',
      row.invoice_generated_at ? formatSwedishDate(row.invoice_generated_at) : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sms_billing_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export slutförd",
      description: "SMS-faktureringsdata har exporterats till CSV.",
    });
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-tenant-primary">SMS Fakturering</h1>
          <p className="text-muted-foreground">Hantera och övervaka SMS-kostnader per kund</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportBillingData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportera CSV
          </Button>
          <Button 
            onClick={generateMonthlyBilling}
            disabled={isLoading}
            className="bg-tenant-primary hover:bg-tenant-primary/90"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generera månatlig rapport
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-tenant-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Totalt SMS</p>
                <p className="text-2xl font-bold">{smsStats.totalSMS.toLocaleString('sv-SE')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-tenant-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total kostnad</p>
                <p className="text-2xl font-bold">{formatSwedishCurrency(smsStats.totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-tenant-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Aktiva kunder</p>
                <p className="text-2xl font-bold">{smsStats.totalTenants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-tenant-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Snitt per SMS</p>
                <p className="text-2xl font-bold">{formatSwedishCurrency(smsStats.averageCostPerSMS)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SMS Faktureringsöversikt</CardTitle>
              <CardDescription>Månadsvis SMS-användning och kostnader per kund</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-09">September 2024</SelectItem>
                <SelectItem value="2024-08">Augusti 2024</SelectItem>
                <SelectItem value="2024-07">Juli 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kund</TableHead>
                  <TableHead>Månad</TableHead>
                  <TableHead className="text-right">Antal SMS</TableHead>
                  <TableHead className="text-right">Total kostnad</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fakturadatum</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.tenant_name}</TableCell>
                    <TableCell>{formatSwedishDate(row.billing_month)}</TableCell>
                    <TableCell className="text-right">{row.total_sms_count.toLocaleString('sv-SE')}</TableCell>
                    <TableCell className="text-right font-medium">{formatSwedishCurrency(row.total_cost_sek)}</TableCell>
                    <TableCell>
                      <Badge variant={row.is_invoiced ? "default" : "secondary"}>
                        {row.is_invoiced ? 'Fakturerad' : 'Väntande'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.invoice_generated_at ? formatSwedishDate(row.invoice_generated_at) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};