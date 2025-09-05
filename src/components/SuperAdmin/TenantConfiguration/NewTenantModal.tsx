import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, Mail, MapPin } from "lucide-react";

interface NewTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenantData: any) => Promise<void>;
}

export const NewTenantModal: React.FC<NewTenantModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    service_type: '',
    address: '',
    postal_code: '',
    city: '',
    invoice_email: '',
    admin_name: '',
    admin_email: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Country configurations
  const countries = [
    { code: 'SE', name: 'Sweden', currency: 'SEK', locale: 'sv' },
    { code: 'NO', name: 'Norway', currency: 'NOK', locale: 'no' },
    { code: 'DK', name: 'Denmark', currency: 'DKK', locale: 'da' },
    { code: 'DE', name: 'Germany', currency: 'EUR', locale: 'de' },
    { code: 'FI', name: 'Finland', currency: 'EUR', locale: 'fi' },
  ];

  // Service types
  const serviceTypes = [
    'Car Scrapyard',
    'Metal Recycling',
    'Auto Parts',
    'Vehicle Recovery',
    'Waste Management',
  ];

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      service_type: '',
      address: '',
      postal_code: '',
      city: '',
      invoice_email: '',
      admin_name: '',
      admin_email: '',
    });
    setErrors({});
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.admin_name.trim()) newErrors.admin_name = 'Admin name is required';
    if (!formData.admin_email.trim()) newErrors.admin_email = 'Admin email is required';
    
    if (formData.admin_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      newErrors.admin_email = 'Invalid email format';
    }
    
    if (formData.invoice_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.invoice_email)) {
      newErrors.invoice_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get country info
  const selectedCountry = countries.find(c => c.code === formData.country);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Tenant
          </DialogTitle>
          <DialogDescription>
            Set up a new tenant with automatic configuration based on country selection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Information
              </CardTitle>
              <CardDescription>Basic company details and registration</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Acme Scrapyard AB"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                          <span>{country.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {country.currency}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
                {selectedCountry && (
                  <p className="text-sm text-muted-foreground">
                    Auto-config: {selectedCountry.currency}, {selectedCountry.locale}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type</Label>
                <Select 
                  value={formData.service_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address Information
              </CardTitle>
              <CardDescription>Company address and location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address, building number"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Stockholm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Information
              </CardTitle>
              <CardDescription>Admin user and billing contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_name">Admin Name *</Label>
                  <Input
                    id="admin_name"
                    value={formData.admin_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                    placeholder="John Doe"
                    className={errors.admin_name ? 'border-red-500' : ''}
                  />
                  {errors.admin_name && <p className="text-sm text-red-500">{errors.admin_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_email">Admin Email *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                    placeholder="admin@company.com"
                    className={errors.admin_email ? 'border-red-500' : ''}
                  />
                  {errors.admin_email && <p className="text-sm text-red-500">{errors.admin_email}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_email">Invoice Email</Label>
                <Input
                  id="invoice_email"
                  type="email"
                  value={formData.invoice_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_email: e.target.value }))}
                  placeholder="billing@company.com"
                  className={errors.invoice_email ? 'border-red-500' : ''}
                />
                {errors.invoice_email && <p className="text-sm text-red-500">{errors.invoice_email}</p>}
                <p className="text-sm text-muted-foreground">
                  If not specified, admin email will be used for billing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Configuration Preview */}
          {selectedCountry && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Auto-Configuration Preview
                </CardTitle>
                <CardDescription>
                  These settings will be automatically configured based on country selection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Currency</p>
                    <p className="font-mono">{selectedCountry.currency}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Locale</p>
                    <p className="font-mono">{selectedCountry.locale}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Billing Cycle</p>
                    <p className="font-mono">monthly</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Creating...' : 'Create Tenant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};