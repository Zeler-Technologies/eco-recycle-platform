import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Building2, MapPin, User, Globe, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const tenantFormSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  country: z.string().min(1, 'Country is required'),
  serviceType: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  adminFirstName: z.string().min(2, 'First name must be at least 2 characters'),
  adminLastName: z.string().min(2, 'Last name must be at least 2 characters'),
  adminEmail: z.string().email('Please enter a valid administrator email address'),
  invoiceEmail: z.string().email('Please enter a valid invoice email address'),
});

type TenantFormData = z.infer<typeof tenantFormSchema>;

interface TenantSetupFormProps {
  onTenantCreated?: (tenant: any) => void;
  editTenant?: Tenant | null;
  onTenantUpdated?: (tenant: any) => void;
}

interface Tenant {
  tenants_id: number;
  name: string;
  country: string;
  service_type: string | null;
  base_address: string | null;
  invoice_email: string | null;
  created_at: string;
  updated_at?: string;
}

const countries = [
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Germany', 'Netherlands', 
  'Belgium', 'France', 'United Kingdom', 'Spain', 'Italy', 'Poland'
];

export const TenantSetupForm = ({ onTenantCreated, editTenant, onTenantUpdated }: TenantSetupFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const isEditing = !!editTenant;
  
  // Open dialog when editing
  React.useEffect(() => {
    if (editTenant) {
      setOpen(true);
    }
  }, [editTenant]);
  
  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      companyName: editTenant?.name || '',
      country: editTenant?.country || '',
      serviceType: editTenant?.service_type || '',
      address: editTenant?.base_address || '',
      postalCode: '',
      city: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      invoiceEmail: editTenant?.invoice_email || '',
    },
  });

  // Reset form values when editTenant changes
  React.useEffect(() => {
    if (editTenant) {
      form.reset({
        companyName: editTenant.name,
        country: editTenant.country,
        serviceType: editTenant.service_type || '',
        address: editTenant.base_address || '',
        postalCode: '',
        city: '',
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
        invoiceEmail: editTenant.invoice_email || '',
      });
    }
  }, [editTenant, form]);

  const onSubmit = async (data: TenantFormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        // Validate admin fields for editing as well
        if (!data.adminFirstName || data.adminFirstName.length < 2) {
          throw new Error('Administrator first name is required and must be at least 2 characters');
        }
        if (!data.adminLastName || data.adminLastName.length < 2) {
          throw new Error('Administrator last name is required and must be at least 2 characters');
        }
        if (!data.adminEmail || !data.adminEmail.includes('@')) {
          throw new Error('Administrator email is required and must be valid');
        }

        // Update existing tenant
        const { data: result, error } = await supabase
          .from('tenants')
          .update({
            name: data.companyName,
            country: data.country,
            service_type: data.serviceType || null,
            base_address: data.address || null,
            invoice_email: data.invoiceEmail,
            updated_at: new Date().toISOString(),
          })
          .eq('tenants_id', editTenant!.tenants_id)
          .select()
          .single();

        if (error) {
          throw new Error(error.message || 'Failed to update tenant');
        }

        // Update tenant admin user information
        const { error: userUpdateError } = await supabase.functions.invoke('update-tenant-user', {
          body: {
            tenantId: editTenant!.tenants_id,
            firstName: data.adminFirstName,
            lastName: data.adminLastName,
            email: data.adminEmail,
            role: 'scrapyard_admin'
          }
        });

        if (userUpdateError) {
          console.warn('Failed to update admin user:', userUpdateError);
          // Don't throw error here, tenant update succeeded
        }

        console.log('Tenant updated successfully:', result);

        toast({
          title: "Tenant Updated Successfully",
          description: `${data.companyName} has been updated.`,
        });
        
        onTenantUpdated?.(result);
        setOpen(false);
        form.reset();
      } else {
        // Create new tenant - validate admin fields
        if (!data.adminFirstName || data.adminFirstName.length < 2) {
          throw new Error('Administrator first name is required and must be at least 2 characters');
        }
        if (!data.adminLastName || data.adminLastName.length < 2) {
          throw new Error('Administrator last name is required and must be at least 2 characters');
        }
        if (!data.adminEmail || !data.adminEmail.includes('@')) {
          throw new Error('Administrator email is required and must be valid');
        }
        
        console.log('Creating tenant with data:', data);
        
        const { data: result, error } = await supabase.rpc('create_tenant_complete', {
          p_name: data.companyName,
          p_country: data.country,
          p_admin_name: `${data.adminFirstName} ${data.adminLastName}`,
          p_admin_email: data.adminEmail,
          p_invoice_email: data.invoiceEmail,
          p_service_type: data.serviceType || null,
          p_address: data.address || null,
          p_postal_code: data.postalCode || null,
          p_city: data.city || null,
        }) as { data: any; error: any };

        if (error) {
          throw new Error(error.message || 'Failed to create tenant');
        }

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to create tenant');
        }

        console.log('Tenant and scrapyard created successfully:', result);

        toast({
          title: "Tenant Created Successfully",
          description: `${data.companyName} has been added to the system. Generated password: ${result.generated_password}`,
        });
        
        onTenantCreated?.(result);
        setOpen(false);
        form.reset();
      }

    } catch (error) {
      console.error('Error with tenant operation:', error);
      toast({
        title: isEditing ? "Error Updating Tenant" : "Error Creating Tenant",
        description: error instanceof Error ? error.message : "There was an error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? 'Edit Tenant' : 'Add New Tenant'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update tenant account information and settings.'
              : 'Create a new tenant account with company information and administrator access.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Company Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Car Recycling, Metal Processing" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional - Description of the main service provided
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Company Address Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Company Address (Optional)</h3>
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Stockholm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Administrator Information Section - Always show */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Administrator Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="adminFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="adminLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {!isEditing && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    A secure password will be automatically generated for the administrator account. 
                    The admin will be able to change it after first login.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Invoice Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Invoice Information</h3>
              </div>
              
              <FormField
                control={form.control}
                name="invoiceEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="billing@company.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Email address where invoices will be sent to the financial department
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setOpen(false);
                if (isEditing) {
                  onTenantUpdated?.(null); // Signal to close edit mode
                }
              }} disabled={loading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  isEditing ? 'Update Tenant' : 'Create Tenant'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};