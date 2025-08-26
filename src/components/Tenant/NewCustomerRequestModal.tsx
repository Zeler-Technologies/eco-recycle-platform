import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface NewCustomerRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const NewCustomerRequestModal = ({ open, onOpenChange, onSuccess }: NewCustomerRequestModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    owner_name: '',
    contact_phone: '',
    pickup_address: '',
    car_brand: '',
    car_model: '',
    car_year: '',
    car_registration_number: '',
    pnr_num: '',
    special_instructions: '',
    quote_amount: '',
    assigned_driver: ''
  });

  
  // Fetch drivers when modal opens
  useEffect(() => {
    if (open && user?.tenant_id) {
      fetchDrivers();
    }
  }, [open, user?.tenant_id]);

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, driver_status')
        .eq('tenant_id', user?.tenant_id)
        .eq('is_active', true);

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ['owner_name', 'contact_phone', 'car_brand', 'car_model', 'car_registration_number', 'pnr_num'];
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Fel",
          description: `${field === 'owner_name' ? 'Namn' : 
                       field === 'contact_phone' ? 'Telefon' :
                       field === 'car_brand' ? 'Bilmärke' :
                       field === 'car_model' ? 'Bilmodell' :
                       field === 'car_registration_number' ? 'Registreringsnummer' :
                       field === 'pnr_num' ? 'Personnummer' : field} är obligatoriskt`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔥 Form submitted!', { formData, user });
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    if (!user?.tenant_id) {
      console.log('❌ No tenant_id found', user);
      toast({
        title: "Fel",
        description: "Kunde inte hitta tenant information",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Starting form submission...');
    setLoading(true);
    try {
      // First create the customer request
      const { data: requestData, error: requestError } = await supabase
        .from('customer_requests')
        .insert({
          tenant_id: user.tenant_id,
          scrapyard_id: 1, // Default scrapyard - should be configurable per tenant
          owner_name: formData.owner_name,
          contact_phone: formData.contact_phone,
          pickup_address: formData.pickup_address || null,
          car_brand: formData.car_brand,
          car_model: formData.car_model,
          car_year: formData.car_year ? parseInt(formData.car_year) : null,
          car_registration_number: formData.car_registration_number,
          pnr_num: formData.pnr_num,
          special_instructions: formData.special_instructions || null,
          quote_amount: formData.quote_amount ? parseFloat(formData.quote_amount) : null,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) throw requestError;
      console.log('✅ Customer request created:', requestData);

      // CRITICAL: Immediately create corresponding pickup_order to ensure visibility in UI
      const { data: pickupOrder, error: pickupError } = await supabase
        .from('pickup_orders')
        .insert({
          customer_request_id: requestData.id,
          tenant_id: user.tenant_id,
          status: 'scheduled',
          scheduled_pickup_date: new Date().toISOString().split('T')[0], // Today as default
          final_price: formData.quote_amount ? parseFloat(formData.quote_amount) : null,
          driver_id: formData.assigned_driver || null
        })
        .select()
        .single();

      if (pickupError) {
        console.error('❌ Failed to create pickup_order:', pickupError);
        // ROLLBACK: Delete the customer_request if pickup_order creation fails
        await supabase.from('customer_requests').delete().eq('id', requestData.id);
        throw new Error('Failed to create pickup order: ' + pickupError.message);
      }
      
      console.log('✅ Pickup order created:', pickupOrder);

      // If a driver was assigned, create the driver assignment
      if (formData.assigned_driver && requestData) {
        const { error: assignmentError } = await supabase
          .from('driver_assignments')
          .insert({
            customer_request_id: requestData.id,
            pickup_order_id: pickupOrder.id,
            driver_id: formData.assigned_driver,
            is_active: true,
            assigned_at: new Date().toISOString(),
            assignment_type: 'pickup',
            role: 'primary'
          });

        if (assignmentError) {
          console.error('Error assigning driver:', assignmentError);
          // Don't fail the entire operation if driver assignment fails
        }
      }

      toast({
        title: "Lyckat!",
        description: formData.assigned_driver ? "Nytt ärende har skapats och förare tilldelad" : "Nytt ärende har skapats",
      });

      // Reset form
      setFormData({
        owner_name: '',
        contact_phone: '',
        pickup_address: '',
        car_brand: '',
        car_model: '',
        car_year: '',
        car_registration_number: '',
        pnr_num: '',
        special_instructions: '',
        quote_amount: '',
        assigned_driver: ''
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating customer request:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa ärendet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nytt ärende</DialogTitle>
          <DialogDescription>
            Lägg till en ny kund och bil för hämtning
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Kundinformation</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner_name">Namn *</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => handleInputChange('owner_name', e.target.value)}
                  placeholder="För- och efternamn"
                />
              </div>
              
              <div>
                <Label htmlFor="pnr_num">Personnummer *</Label>
                <Input
                  id="pnr_num"
                  value={formData.pnr_num}
                  onChange={(e) => handleInputChange('pnr_num', e.target.value)}
                  placeholder="YYYYMMDD-XXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_phone">Telefon *</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="08-123 45 67"
                />
              </div>
              
              <div>
                <Label htmlFor="pickup_address">Hämtadress</Label>
                <Input
                  id="pickup_address"
                  value={formData.pickup_address}
                  onChange={(e) => handleInputChange('pickup_address', e.target.value)}
                  placeholder="Gata, postnummer, ort"
                />
              </div>
            </div>
          </div>

          {/* Car Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bilinformation</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="car_brand">Märke *</Label>
                <Input
                  id="car_brand"
                  value={formData.car_brand}
                  onChange={(e) => handleInputChange('car_brand', e.target.value)}
                  placeholder="Volvo"
                />
              </div>
              
              <div>
                <Label htmlFor="car_model">Modell *</Label>
                <Input
                  id="car_model"
                  value={formData.car_model}
                  onChange={(e) => handleInputChange('car_model', e.target.value)}
                  placeholder="V70"
                />
              </div>
              
              <div>
                <Label htmlFor="car_year">År</Label>
                <Input
                  id="car_year"
                  type="number"
                  value={formData.car_year}
                  onChange={(e) => handleInputChange('car_year', e.target.value)}
                  placeholder="2010"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="car_registration_number">Registreringsnummer *</Label>
                <Input
                  id="car_registration_number"
                  value={formData.car_registration_number}
                  onChange={(e) => handleInputChange('car_registration_number', e.target.value.toUpperCase())}
                  placeholder="ABC123"
                />
              </div>
              
              <div>
                <Label htmlFor="quote_amount">Uppskattad värdering (kr)</Label>
                <Input
                  id="quote_amount"
                  type="number"
                  value={formData.quote_amount}
                  onChange={(e) => handleInputChange('quote_amount', e.target.value)}
                  placeholder="5000"
                />
              </div>
            </div>
          </div>

          {/* Driver Assignment */}
          <div>
            <Label htmlFor="assigned_driver">Förare</Label>
            <Select value={formData.assigned_driver} onValueChange={(value) => handleInputChange('assigned_driver', value === 'none' ? '' : value)}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Välj förare (valfritt)" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="none">Ingen förare tilldelad</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.full_name} ({driver.driver_status || 'offline'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Information */}
          <div>
            <Label htmlFor="special_instructions">Särskilda instruktioner</Label>
            <Textarea
              id="special_instructions"
              value={formData.special_instructions}
              onChange={(e) => handleInputChange('special_instructions', e.target.value)}
              placeholder="Eventuella anteckningar om bilen eller hämtningen..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-tenant-primary hover:bg-tenant-primary/90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Skapa ärende
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};