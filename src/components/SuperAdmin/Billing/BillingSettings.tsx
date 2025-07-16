import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  Globe, 
  Mail, 
  CreditCard, 
  Calendar, 
  Percent,
  AlertTriangle,
  DollarSign,
  FileText,
  Bell
} from 'lucide-react';

interface BillingConfig {
  currency: string;
  timezone: string;
  billingCycle: string;
  taxRate: number;
  paymentTerms: number;
  autoGenerate: boolean;
  autoSend: boolean;
  reminderDays: number[];
  dunningEnabled: boolean;
  dunningAttempts: number;
  dunningInterval: number;
  locale: string;
  emailSettings: {
    fromEmail: string;
    fromName: string;
    invoiceTemplate: string;
    reminderTemplate: string;
    overdueTemplate: string;
  };
  sharedCosts: {
    infrastructure: number;
    support: number;
    marketing: number;
    development: number;
  };
}

export const BillingSettings = () => {
  const [config, setConfig] = useState<BillingConfig>({
    currency: 'EUR',
    timezone: 'Europe/Stockholm',
    billingCycle: 'monthly',
    taxRate: 25,
    paymentTerms: 15,
    autoGenerate: true,
    autoSend: false,
    reminderDays: [7, 3, 1],
    dunningEnabled: true,
    dunningAttempts: 3,
    dunningInterval: 7,
    locale: 'sv_SE',
    emailSettings: {
      fromEmail: 'billing@carrecycling.se',
      fromName: 'Car Recycling Platform',
      invoiceTemplate: 'default',
      reminderTemplate: 'friendly',
      overdueTemplate: 'urgent'
    },
    sharedCosts: {
      infrastructure: 2500,
      support: 1200,
      marketing: 800,
      development: 1500
    }
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleSave = () => {
    // Save configuration
    console.log('Saving billing configuration:', config);
  };

  const handleConfigChange = (section: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof BillingConfig],
        [field]: value
      }
    }));
  };

  const handleDirectChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'costs', label: 'Shared Costs', icon: DollarSign }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-admin-primary">Billing Settings</h2>
          <p className="text-muted-foreground">Configure billing cycles, payment terms, and automation</p>
        </div>
        <Button 
          className="bg-admin-primary hover:bg-admin-primary/90"
          onClick={handleSave}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-admin-primary text-admin-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-custom-sm">
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
                  <Select value={config.currency} onValueChange={(value) => handleDirectChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="SEK">SEK (kr)</SelectItem>
                      <SelectItem value="NOK">NOK (kr)</SelectItem>
                      <SelectItem value="DKK">DKK (kr)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={config.timezone} onValueChange={(value) => handleDirectChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Stockholm">Stockholm</SelectItem>
                      <SelectItem value="Europe/Oslo">Oslo</SelectItem>
                      <SelectItem value="Europe/Copenhagen">Copenhagen</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="locale">Locale</Label>
                <Select value={config.locale} onValueChange={(value) => handleDirectChange('locale', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sv_SE">Swedish</SelectItem>
                    <SelectItem value="en_US">English (US)</SelectItem>
                    <SelectItem value="nb_NO">Norwegian</SelectItem>
                    <SelectItem value="da_DK">Danish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-custom-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Billing Cycle
              </CardTitle>
              <CardDescription>Configure billing frequency and tax settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="billingCycle">Billing Cycle</Label>
                <Select value={config.billingCycle} onValueChange={(value) => handleDirectChange('billingCycle', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={config.taxRate}
                  onChange={(e) => handleDirectChange('taxRate', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  value={config.paymentTerms}
                  onChange={(e) => handleDirectChange('paymentTerms', parseInt(e.target.value))}
                  min="1"
                  max="90"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-custom-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Automation Settings
              </CardTitle>
              <CardDescription>Configure automated billing processes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoGenerate">Auto-generate invoices</Label>
                  <p className="text-sm text-muted-foreground">Automatically create invoices at billing cycle end</p>
                </div>
                <Switch
                  id="autoGenerate"
                  checked={config.autoGenerate}
                  onCheckedChange={(checked) => handleDirectChange('autoGenerate', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSend">Auto-send invoices</Label>
                  <p className="text-sm text-muted-foreground">Automatically send invoices to tenants</p>
                </div>
                <Switch
                  id="autoSend"
                  checked={config.autoSend}
                  onCheckedChange={(checked) => handleDirectChange('autoSend', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-custom-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Dunning & Reminders
              </CardTitle>
              <CardDescription>Configure payment reminders and dunning process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dunningEnabled">Enable dunning process</Label>
                  <p className="text-sm text-muted-foreground">Automatic follow-up for overdue invoices</p>
                </div>
                <Switch
                  id="dunningEnabled"
                  checked={config.dunningEnabled}
                  onCheckedChange={(checked) => handleDirectChange('dunningEnabled', checked)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dunningAttempts">Dunning attempts</Label>
                  <Input
                    id="dunningAttempts"
                    type="number"
                    value={config.dunningAttempts}
                    onChange={(e) => handleDirectChange('dunningAttempts', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <Label htmlFor="dunningInterval">Interval (days)</Label>
                  <Input
                    id="dunningInterval"
                    type="number"
                    value={config.dunningInterval}
                    onChange={(e) => handleDirectChange('dunningInterval', parseInt(e.target.value))}
                    min="1"
                    max="30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <Card className="bg-white shadow-custom-sm">
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
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={config.emailSettings.fromEmail}
                    onChange={(e) => handleConfigChange('emailSettings', 'fromEmail', e.target.value)}
                    placeholder="billing@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={config.emailSettings.fromName}
                    onChange={(e) => handleConfigChange('emailSettings', 'fromName', e.target.value)}
                    placeholder="Company Name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoiceTemplate">Invoice Template</Label>
                  <Select 
                    value={config.emailSettings.invoiceTemplate} 
                    onValueChange={(value) => handleConfigChange('emailSettings', 'invoiceTemplate', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reminderTemplate">Reminder Template</Label>
                  <Select 
                    value={config.emailSettings.reminderTemplate} 
                    onValueChange={(value) => handleConfigChange('emailSettings', 'reminderTemplate', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="overdueTemplate">Overdue Template</Label>
                  <Select 
                    value={config.emailSettings.overdueTemplate} 
                    onValueChange={(value) => handleConfigChange('emailSettings', 'overdueTemplate', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="final">Final Notice</SelectItem>
                      <SelectItem value="legal">Legal Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shared Costs */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          <Card className="bg-white shadow-custom-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Shared Cost Allocation
              </CardTitle>
              <CardDescription>Configure shared infrastructure and service costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="infrastructure">Infrastructure (€/month)</Label>
                  <Input
                    id="infrastructure"
                    type="number"
                    value={config.sharedCosts.infrastructure}
                    onChange={(e) => handleConfigChange('sharedCosts', 'infrastructure', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Server hosting, CDN, database costs</p>
                </div>
                <div>
                  <Label htmlFor="support">Support (€/month)</Label>
                  <Input
                    id="support"
                    type="number"
                    value={config.sharedCosts.support}
                    onChange={(e) => handleConfigChange('sharedCosts', 'support', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Customer support and help desk</p>
                </div>
                <div>
                  <Label htmlFor="marketing">Marketing (€/month)</Label>
                  <Input
                    id="marketing"
                    type="number"
                    value={config.sharedCosts.marketing}
                    onChange={(e) => handleConfigChange('sharedCosts', 'marketing', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Marketing and advertising costs</p>
                </div>
                <div>
                  <Label htmlFor="development">Development (€/month)</Label>
                  <Input
                    id="development"
                    type="number"
                    value={config.sharedCosts.development}
                    onChange={(e) => handleConfigChange('sharedCosts', 'development', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Development and maintenance</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-admin-accent/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-admin-primary" />
                  <span className="font-medium">Total Monthly Shared Costs</span>
                </div>
                <div className="text-2xl font-bold text-admin-primary">
                  €{(config.sharedCosts.infrastructure + config.sharedCosts.support + config.sharedCosts.marketing + config.sharedCosts.development).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This amount will be allocated across tenants based on their usage or configured share percentages
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};