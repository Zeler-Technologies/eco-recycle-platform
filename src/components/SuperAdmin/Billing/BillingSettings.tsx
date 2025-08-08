import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Globe, CreditCard, Mail, DollarSign, Save, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { useBillingConfig } from '@/hooks/useBillingConfig';
import { useBillingOptions } from '@/hooks/useBillingOptions';
import { useToast } from '@/hooks/use-toast';

interface BillingSettingsProps {
  tenantId?: number;
}

export const BillingSettings: React.FC<BillingSettingsProps> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [reminderDaysInput, setReminderDaysInput] = useState('');
  const { toast } = useToast();

  const {
    config,
    isLoading: configLoading,
    error: configError,
    hasUnsavedChanges,
    updateConfig,
    saveAllChanges,
    resetChanges
  } = useBillingConfig(tenantId);

  const {
    options,
    isLoading: optionsLoading,
    error: optionsError,
    getCurrencyOptions,
    getTimezoneOptions,
    getLocaleOptions,
    getEmailTemplateOptions,
    getBillingCycleOptions
  } = useBillingOptions();

  // Initialize reminder days input when config loads
  useEffect(() => {
    if (config.payment?.reminder_days) {
      setReminderDaysInput(config.payment.reminder_days.join(', '));
    }
  }, [config.payment?.reminder_days]);

  const handleSave = async () => {
    const success = await saveAllChanges();
    if (success) {
      toast({
        title: 'Success',
        description: 'Billing configuration saved successfully',
      });
    }
  };

  const handleReset = () => {
    resetChanges();
    if (config.payment?.reminder_days) {
      setReminderDaysInput(config.payment.reminder_days.join(', '));
    }
    toast({
      title: 'Reset',
      description: 'Changes have been reset to saved values',
    });
  };

  const handleReminderDaysChange = (value: string) => {
    setReminderDaysInput(value);
    
    // Parse and validate reminder days
    const days = value
      .split(',')
      .map(d => parseInt(d.trim()))
      .filter(d => !isNaN(d) && d > 0)
      .sort((a, b) => a - b);
    
    updateConfig('payment', 'reminder_days', days);
  };

  const handleSharedCostChange = (category: string, percentage: number) => {
    const updatedSharedCosts = {
      ...config.shared_costs,
      [category]: { percentage }
    };
    updateConfig('shared_costs', 'categories', updatedSharedCosts);
  };

  const isLoading = configLoading || optionsLoading;
  const hasError = configError || optionsError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load billing configuration: {configError || optionsError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Billing Settings</h2>
          <p className="text-muted-foreground">Configure billing cycles, payment terms, and automation</p>
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasUnsavedChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Make sure to save your configuration before leaving this page.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="shared_costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Shared Costs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional Settings
                </CardTitle>
                <CardDescription>Currency, timezone, and locale configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={config.general?.currency || ''} 
                      onValueChange={(value) => updateConfig('general', 'currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCurrencyOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={config.general?.timezone || ''} 
                      onValueChange={(value) => updateConfig('general', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {getTimezoneOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="locale">Locale</Label>
                  <Select 
                    value={config.general?.locale || ''} 
                    onValueChange={(value) => updateConfig('general', 'locale', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select locale" />
                    </SelectTrigger>
                    <SelectContent>
                      {getLocaleOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="billing_cycle">Billing Cycle</Label>
                  <Select 
                    value={config.general?.billing_cycle || ''} 
                    onValueChange={(value) => updateConfig('general', 'billing_cycle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBillingCycleOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Terms
                </CardTitle>
                <CardDescription>Configure payment terms and tax settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    value={config.payment?.tax_rate || 0}
                    onChange={(e) => updateConfig('payment', 'tax_rate', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_terms_days">Payment Terms (days)</Label>
                  <Input
                    id="payment_terms_days"
                    type="number"
                    value={config.payment?.payment_terms_days || 30}
                    onChange={(e) => updateConfig('payment', 'payment_terms_days', parseInt(e.target.value) || 30)}
                    min="1"
                    max="90"
                  />
                </div>
                <div>
                  <Label htmlFor="reminder_days">Reminder Days (comma separated)</Label>
                  <Input
                    id="reminder_days"
                    value={reminderDaysInput}
                    onChange={(e) => handleReminderDaysChange(e.target.value)}
                    placeholder="7, 14, 30"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Days before/after due date to send reminders
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>Configure email settings for invoice delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={config.email?.from_email || ''}
                    onChange={(e) => updateConfig('email', 'from_email', e.target.value)}
                    placeholder="billing@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={config.email?.from_name || ''}
                    onChange={(e) => updateConfig('email', 'from_name', e.target.value)}
                    placeholder="Company Name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="template_invoice">Invoice Template</Label>
                  <Select 
                    value={config.email?.template_invoice || ''} 
                    onValueChange={(value) => updateConfig('email', 'template_invoice', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEmailTemplateOptions('invoice').map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template_reminder">Reminder Template</Label>
                  <Select 
                    value={config.email?.template_reminder || ''} 
                    onValueChange={(value) => updateConfig('email', 'template_reminder', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEmailTemplateOptions('reminder').map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template_overdue">Overdue Template</Label>
                  <Select 
                    value={config.email?.template_overdue || ''} 
                    onValueChange={(value) => updateConfig('email', 'template_overdue', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEmailTemplateOptions('overdue').map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared_costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Shared Cost Allocation
              </CardTitle>
              <CardDescription>Configure shared infrastructure and service costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.shared_costs && Object.entries(config.shared_costs).map(([category, data]) => (
                <div key={category} className="grid grid-cols-3 gap-4 items-center">
                  <Label className="capitalize">{category} (%)</Label>
                  <Input
                    type="number"
                    value={data.percentage || 0}
                    onChange={(e) => handleSharedCostChange(category, parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <Badge variant="secondary">
                    {data.percentage || 0}% allocation
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};