import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Simple mock components until the full integration is complete
export const ServiceCostTab: React.FC<{
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}> = ({ selectedMonth, setSelectedMonth }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Cost Management</CardTitle>
          <CardDescription>Service pricing and usage tracking will be implemented here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Service cost management features will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const InvoiceDetailModal: React.FC<{
  invoice: any;
  onClose: () => void;
}> = ({ invoice, onClose }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invoice Details: {invoice.invoice_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tenant:</Label>
              <div className="font-medium">{invoice.tenant_name}</div>
            </div>
            <div>
              <Label>Amount:</Label>
              <div className="font-medium">
                {new Intl.NumberFormat('sv-SE', {
                  style: 'currency',
                  currency: 'SEK'
                }).format(invoice.total_amount)}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};