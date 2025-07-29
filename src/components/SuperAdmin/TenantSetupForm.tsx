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
  adminName: z.string().min(2, 'Administrator name is required'),
  adminEmail: z.string().email('Please enter a valid email address'),
});

type TenantFormData = z.infer<typeof tenantFormSchema>;

interface TenantSetupFormProps {
  onTenantCreated?: (tenant: any) => void;
}

const countries = [
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Germany', 'Netherlands', 
  'Belgium', 'France', 'United Kingdom', 'Spain', 'Italy', 'Poland'
];

export const TenantSetupForm = ({ onTenantCreated }: TenantSetupFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      companyName: '',
      country: '',
      serviceType: '',
      address: '',
      postalCode: '',
      city: '',
      adminName: '',
      adminEmail: '',
    },
  });

  const onSubmit = async (data: TenantFormData) => {
    setLoading(true);
    try {
      console.log('Creating tenant with data:', data);
      
      // Step 1: Create the tenant and scrapyard using the database function
      const { data: tenantResult, error: tenantError } = await supabase.rpc('create_tenant_complete', {
        p_name: data.companyName,
        p_country: data.country,
        p_admin_name: data.adminName,
        p_admin_email: data.adminEmail,
        p_service_type: data.serviceType || null,
        p_address: data.address || null,
        p_postal_code: data.postalCode || null,
        p_city: data.city || null,
      });

      if (tenantError) {
        throw new Error(tenantError.message || 'Failed to create tenant');
      }

      // Type assertion for the result
      const result = tenantResult as any;
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create tenant');
      }

      console.log('Tenant created successfully:', result);

      // Step 2: Create the tenant admin user via Edge Function
      const { data: userResult, error: userError } = await supabase.functions.invoke('create-tenant-admin', {
        body: {
          tenantId: result.tenant_id,
          scrapyardId: result.scrapyard_id,
          adminEmail: result.admin_email,
          adminName: result.admin_name,
          password: result.generated_password,
        },
      });

      if (userError) {
        console.error('Edge function error:', userError);
        throw new Error(userError.message || 'Failed to create tenant admin user');
      }

      // Type assertion for the user result
      const userRes = userResult as any;
      if (!userRes?.success) {
        throw new Error(userRes?.error || 'Failed to create tenant admin user');
      }

      console.log('Admin user created successfully:', userRes);

      toast({
        title: "Tenant Created Successfully",
        description: `${data.companyName} has been added to the system. Admin login details: ${data.adminEmail} with password: ${result.generated_password}`,
      });
      
      onTenantCreated?.(result);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({
        title: "Error Creating Tenant",
        description: error instanceof Error ? error.message : "There was an error creating the tenant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Add New Tenant
          </DialogTitle>
          <DialogDescription>
            Create a new tenant account with company information and administrator access.
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

            {/* Administrator Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Administrator Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Administrator Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                      <FormLabel>Administrator Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  A secure password will be automatically generated for the administrator account. 
                  The admin will be able to change it after first login.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
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
                  'Create Tenant'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};