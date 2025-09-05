import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Globe, Mail, CreditCard, Settings } from "lucide-react";

interface ConfigurationModalProps {
  tenant: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: any[]) => Promise<void>;
  existingConfigs: any[];
}

export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  tenant,
  isOpen,
  onClose,
  onSave,
  existingConfigs
}) => {
  const [configs, setConfigs] = useState({
    currency: '',
    locale: '',
    timezone: '',
    billing_cycle: '',
    from_email: '',
    from_name: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Country-based defaults
  const getDefaultsForCountry = (country: string) => {
    const defaults = {
      'SE': { currency: 'SEK', locale: 'sv', timezone: 'Europe/Stockholm' },
      'NO': { currency: 'NOK', locale: 'no', timezone: 'Europe/Oslo' },
      'DK': { currency: 'DKK', locale: 'da', timezone: 'Europe/Copenhagen' },
      'DE': { currency: 'EUR', locale: 'de', timezone: 'Europe/Berlin' },
      'FI': { currency: 'EUR', locale: 'fi', timezone: 'Europe/Helsinki' },
    };
    return defaults[country] || { currency: 'EUR', locale: 'en', timezone: 'Europe/Stockholm' };
  };

  // Load existing configurations
  useEffect(() => {
    if (tenant && isOpen) {
      const getConfigValue = (category: string, key: string) => {
        const config = existingConfigs.find(c => 
          c.config_category === category && c.config_key === key
        );
        return config?.config_value || null;
      };

      const defaults = getDefaultsForCountry(tenant.country);
      
      setConfigs({
        currency: getConfigValue('general', 'currency')?.currency || defaults.currency,
        locale: getConfigValue('general', 'locale')?.locale || defaults.locale,
        timezone: getConfigValue('general', 'timezone')?.timezone || defaults.timezone,
        billing_cycle: getConfigValue('general', 'billing_cycle')?.billing_cycle || 'monthly',
        from_email: getConfigValue('email', 'from_email')?.from_email || '',
        from_name: getConfigValue('email', 'from_name')?.from_name || `${tenant.name} Billing`,
      });
      
      setErrors({});
    }
  }, [tenant, isOpen, existingConfigs]);

  // Validation
  const validateConfigs = () => {
    const newErrors: Record<string, string> = {};

    if (!configs.currency) newErrors.currency = 'Currency is required';
    if (!configs.locale) newErrors.locale = 'Locale is required';
    if (!configs.timezone) newErrors.timezone = 'Timezone is required';
    if (!configs.billing_cycle) newErrors.billing_cycle = 'Billing cycle is required';
    
    if (configs.from_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configs.from_email)) {
      newErrors.from_email = 'Invalid email format';
    }
    
    if (!configs.from_name) newErrors.from_name = 'From name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateConfigs()) return;

    setLoading(true);
    try {
      const updates = [
        { category: 'general', key: 'currency', value: { currency: configs.currency } },
        { category: 'general', key: 'locale', value: { locale: configs.locale } },
        { category: 'general', key: 'timezone', value: { timezone: configs.timezone } },
        { category: 'general', key: 'billing_cycle', value: { billing_cycle: configs.billing_cycle } },
        { category: 'email', key: 'from_email', value: { from_email: configs.from_email } },
        { category: 'email', key: 'from_name', value: { from_name: configs.from_name } },
      ];

      await onSave(updates);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fill country defaults
  const applyCountryDefaults = () => {
    const defaults = getDefaultsForCountry(tenant.country);
    setConfigs(prev => ({
      ...prev,
      ...defaults,
      from_email: prev.from_email || `billing@${tenant.name.toLowerCase().replace(/\s+/g, '')}.com`,
    }));
  };

  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure {tenant.name}
          </DialogTitle>
          <DialogDescription>
            Set up billing configuration, currency, locale, and email settings for this tenant.
            <Badge variant="outline" className="ml-2">{tenant.country}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={applyCountryDefaults}
            >
              Apply {tenant.country} Defaults
            </Button>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Regional Settings</CardTitle>
                  <CardDescription>Configure currency, locale, and timezone</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Select 
                      value={configs.currency} 
                      onValueChange={(value) => setConfigs(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger className={errors.currency ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEK">SEK - Swedish Krona</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="NOK">NOK - Norwegian Krone</SelectItem>
                        <SelectItem value="DKK">DKK - Danish Krone</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.currency && <p className="text-sm text-red-500">{errors.currency}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locale">Locale *</Label>
                    <Select 
                      value={configs.locale} 
                      onValueChange={(value) => setConfigs(prev => ({ ...prev, locale: value }))}
                    >
                      <SelectTrigger className={errors.locale ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select locale" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sv">sv - Swedish</SelectItem>
                        <SelectItem value="en">en - English</SelectItem>
                        <SelectItem value="no">no - Norwegian</SelectItem>
                        <SelectItem value="da">da - Danish</SelectItem>
                        <SelectItem value="de">de - German</SelectItem>
                        <SelectItem value="fi">fi - Finnish</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.locale && <p className="text-sm text-red-500">{errors.locale}</p>}
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="timezone">Timezone *</Label>
                    <Select 
                      value={configs.timezone} 
                      onValueChange={(value) => setConfigs(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger className={errors.timezone ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Stockholm">Europe/Stockholm (Sweden)</SelectItem>
                        <SelectItem value="Europe/Oslo">Europe/Oslo (Norway)</SelectItem>
                        <SelectItem value="Europe/Copenhagen">Europe/Copenhagen (Denmark)</SelectItem>
                        <SelectItem value="Europe/Berlin">Europe/Berlin (Germany)</SelectItem>
                        <SelectItem value="Europe/Helsinki">Europe/Helsinki (Finland)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (UK)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.timezone && <p className="text-sm text-red-500">{errors.timezone}</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email Configuration</CardTitle>
                  <CardDescription>Configure sender information for billing emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="from_email">From Email *</Label>
                    <Input
                      id="from_email"
                      type="email"
                      value={configs.from_email}
                      onChange={(e) => setConfigs(prev => ({ ...prev, from_email: e.target.value }))}
                      placeholder="billing@example.com"
                      className={errors.from_email ? 'border-red-500' : ''}
                    />
                    {errors.from_email && <p className="text-sm text-red-500">{errors.from_email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from_name">From Name *</Label>
                    <Input
                      id="from_name"
                      value={configs.from_name}
                      onChange={(e) => setConfigs(prev => ({ ...prev, from_name: e.target.value }))}
                      placeholder="Company Billing"
                      className={errors.from_name ? 'border-red-500' : ''}
                    />
                    {errors.from_name && <p className="text-sm text-red-500">{errors.from_name}</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Billing Settings</CardTitle>
                  <CardDescription>Configure billing cycle and payment terms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing_cycle">Billing Cycle *</Label>
                    <Select 
                      value={configs.billing_cycle} 
                      onValueChange={(value) => setConfigs(prev => ({ ...prev, billing_cycle: value }))}
                    >
                      <SelectTrigger className={errors.billing_cycle ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select billing cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.billing_cycle && <p className="text-sm text-red-500">{errors.billing_cycle}</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};