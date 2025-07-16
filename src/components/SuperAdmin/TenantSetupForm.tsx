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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, Building2, MapPin, User, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const tenantFormSchema = z.object({
  // Company Information
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  organisationNumber: z.string().min(3, 'Organisation number is required'),
  vatNumber: z.string().optional(),
  
  // Company Address
  address: z.string().min(5, 'Address is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  city: z.string().min(2, 'City is required'),
  
  // Administrator Information
  adminName: z.string().min(2, 'Administrator name is required'),
  adminEmail: z.string().email('Please enter a valid email address'),
  
  // Invoice Information
  invoiceEmail: z.string().email('Please enter a valid invoice email'),
  useDifferentInvoiceAddress: z.boolean().default(false),
  
  // Conditional Invoice Address
  invoiceAddress: z.string().optional(),
  invoicePostalCode: z.string().optional(),
  invoiceCity: z.string().optional(),
}).refine((data) => {
  if (data.useDifferentInvoiceAddress) {
    return data.invoiceAddress && data.invoicePostalCode && data.invoiceCity;
  }
  return true;
}, {
  message: "Invoice address fields are required when using different address",
  path: ["invoiceAddress"],
});

type TenantFormData = z.infer<typeof tenantFormSchema>;

interface TenantSetupFormProps {
  onTenantCreated?: (tenant: TenantFormData) => void;
}

export const TenantSetupForm = ({ onTenantCreated }: TenantSetupFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      companyName: '',
      organisationNumber: '',
      vatNumber: '',
      address: '',
      postalCode: '',
      city: '',
      adminName: '',
      adminEmail: '',
      invoiceEmail: '',
      useDifferentInvoiceAddress: false,
      invoiceAddress: '',
      invoicePostalCode: '',
      invoiceCity: '',
    },
  });

  const watchUseDifferentAddress = form.watch('useDifferentInvoiceAddress');

  const onSubmit = async (data: TenantFormData) => {
    try {
      // Here you would typically send the data to your backend
      console.log('Creating tenant:', data);
      
      toast({
        title: "Tenant Created Successfully",
        description: `${data.companyName} has been added to the system.`,
      });
      
      onTenantCreated?.(data);
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error Creating Tenant",
        description: "There was an error creating the tenant. Please try again.",
        variant: "destructive",
      });
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
            Create a new tenant account with company and billing information.
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
                  name="organisationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organisation Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="vatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Number</FormLabel>
                    <FormControl>
                      <Input placeholder="SE123456789001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional - Enter if the company is VAT registered
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
                <h3 className="text-lg font-semibold">Company Address</h3>
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
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
                      <FormLabel>Postal Code *</FormLabel>
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
                      <FormLabel>City *</FormLabel>
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
            </div>

            <Separator />

            {/* Smart Invoice Address Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
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
                      Email address where invoices will be sent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="useDifferentInvoiceAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Use different address for invoicing</FormLabel>
                      <FormDescription>
                        {!watchUseDifferentAddress 
                          ? "Invoice address will be the same as company address"
                          : "Provide a different address for invoicing"
                        }
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {watchUseDifferentAddress && (
                <div className="space-y-4 pl-6 border-l-2 border-muted">
                  <FormField
                    control={form.control}
                    name="invoiceAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="456 Billing Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoicePostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Postal Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="54321" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="invoiceCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Gothenburg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Create Tenant
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};