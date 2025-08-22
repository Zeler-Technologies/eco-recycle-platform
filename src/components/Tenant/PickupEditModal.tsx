import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PickupEditModalProps {
  pickup: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PickupEditModal: React.FC<PickupEditModalProps> = ({
  pickup,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  
  // Form state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [reimbursement, setReimbursement] = useState('');

  // Load initial data when pickup changes
  useEffect(() => {
    if (pickup && isOpen) {
      console.log('🔴 MODAL OPENED WITH PICKUP:', pickup);
      console.log('🔴 PICKUP.DRIVER_ID:', pickup?.driver_id);
      console.log('🔴 TYPEOF DRIVER_ID:', typeof pickup?.driver_id);
      
      setScheduleDate(pickup.pickup_date || format(new Date(), 'yyyy-MM-dd'));
      setReimbursement(pickup.quote_amount?.toString() || '');
      
      // Set driver ID directly from pickup data
      if (pickup.driver_id) {
        console.log('🟢 SETTING DRIVER ID FROM PICKUP:', pickup.driver_id);
        setSelectedDriverId(pickup.driver_id);
      } else {
        console.log('🔴 NO DRIVER ID IN PICKUP, SETTING TO NONE');
        setSelectedDriverId('none');
      }
      
      fetchDrivers();
    } else if (!isOpen) {
      // Reset state when modal is closed
      setSelectedDriverId('none');
      setScheduleDate('');
      setReimbursement('');
      setLoading(false);
    }
  }, [pickup, isOpen]);

  // Removed fetchCurrentDriverAssignment - no longer needed as we get driver_id directly from parent

  const fetchDrivers = async () => {
    try {
      console.log('🔴 FETCHING DRIVERS FOR TENANT:', pickup.tenant_id);
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, phone_number, driver_status')
        .eq('tenant_id', pickup.tenant_id)
        .eq('is_active', true);

      if (error) throw error;
      console.log('🔴 DRIVERS FETCHED:', data);
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log('🔴 SAVE STARTED for pickup:', pickup.id);

      // Update pickup date in pickup_orders table
      const pickupDateTime = scheduleDate;
      console.log('🔴 UPDATING PICKUP DATE...');
      const { error: dateError } = await supabase
        .from('pickup_orders')
        .update({ scheduled_pickup_date: pickupDateTime })
        .eq('customer_request_id', pickup.id);

      if (dateError) {
        console.error('🔴 ERROR UPDATING PICKUP DATE:', dateError);
        throw dateError;
      }
      console.log('✅ PICKUP DATE UPDATED');

      // Update reimbursement in customer_requests
      console.log('🔴 CHECKING REIMBURSEMENT UPDATE...');
      if (reimbursement && parseFloat(reimbursement) !== pickup.quote_amount) {
        console.log('🔴 UPDATING REIMBURSEMENT...');
        const { error: reimbursementError } = await supabase
          .from('customer_requests')
          .update({ quote_amount: parseFloat(reimbursement) })
          .eq('id', pickup.id);

        if (reimbursementError) {
          console.error('🔴 ERROR UPDATING REIMBURSEMENT:', reimbursementError);
          throw reimbursementError;
        }
        console.log('✅ REIMBURSEMENT UPDATED');
      } else {
        console.log('⏭️ SKIPPING REIMBURSEMENT UPDATE');
      }

      // Handle driver assignment/unassignment
      console.log('🔴 HANDLING DRIVER ASSIGNMENT, selectedDriverId:', selectedDriverId);
      
      if (selectedDriverId === 'none') {
        console.log('🔴 UNASSIGNING DRIVER PATH');
        
        // UNASSIGN DRIVER CASE - Deactivate existing assignments
        console.log('🔴 DEACTIVATING DRIVER ASSIGNMENTS...');
        const { error: unassignError } = await supabase
          .from('driver_assignments')
          .update({ is_active: false })
          .eq('customer_request_id', pickup.id)
          .eq('is_active', true);

        if (unassignError) {
          console.error('🔴 ERROR UNASSIGNING DRIVER:', unassignError);
          throw unassignError;
        }
        console.log('✅ DRIVER ASSIGNMENTS DEACTIVATED');

        // Skip status update for cancelled pickups
        if (pickup.status !== 'cancelled') {
          console.log('🔴 UPDATING STATUS TO SCHEDULED...');
          const { error: statusError } = await supabase.rpc('update_pickup_status_unified', {
            pickup_id: pickup.id,
            new_status: 'scheduled',
            driver_notes_param: 'Driver unassigned - available for self-assignment',
            completion_photos_param: null
          });

          if (statusError) {
            console.error('🔴 ERROR UPDATING STATUS TO SCHEDULED:', statusError);
            throw statusError;
          }
          console.log('✅ STATUS UPDATED TO SCHEDULED');
        } else {
          console.log('⏭️ SKIPPING STATUS UPDATE - PICKUP IS CANCELLED');
        }

      } else if (selectedDriverId && selectedDriverId !== 'none') {
        console.log('🔴 ASSIGNING DRIVER PATH:', selectedDriverId);
        
        // ASSIGN DRIVER CASE - First deactivate any existing assignments
        console.log('🔴 DEACTIVATING EXISTING ASSIGNMENTS...');
        const { error: deactivateError } = await supabase
          .from('driver_assignments')
          .update({ is_active: false })
          .eq('customer_request_id', pickup.id);

        if (deactivateError) {
          console.error('🔴 ERROR DEACTIVATING ASSIGNMENTS:', deactivateError);
          throw deactivateError;
        }
        console.log('✅ EXISTING ASSIGNMENTS DEACTIVATED');

        // Create new assignment
        console.log('🔴 CREATING NEW ASSIGNMENT...');
        const { error: assignmentError } = await supabase
          .from('driver_assignments')
          .insert({
            customer_request_id: pickup.id,
            driver_id: selectedDriverId,
            role: 'primary',
            assignment_type: 'pickup',
            is_active: true
          });

        if (assignmentError) {
          console.error('🔴 ERROR CREATING ASSIGNMENT:', assignmentError);
          throw assignmentError;
        }
        console.log('✅ NEW ASSIGNMENT CREATED');

        // Skip status update for cancelled pickups
        if (pickup.status !== 'cancelled') {
          console.log('🔴 UPDATING STATUS TO ASSIGNED...');
          const { error: statusError } = await supabase.rpc('update_pickup_status_unified', {
            pickup_id: pickup.id,
            new_status: 'assigned',
            driver_notes_param: 'Driver assigned via admin modal',
            completion_photos_param: null
          });

          if (statusError) {
            console.error('🔴 ERROR UPDATING STATUS TO ASSIGNED:', statusError);
            throw statusError;
          }
          console.log('✅ STATUS UPDATED TO ASSIGNED');
        } else {
          console.log('⏭️ SKIPPING STATUS UPDATE - PICKUP IS CANCELLED');
        }
      } else {
        console.log('⏭️ NO DRIVER CHANGES NEEDED');
      }

      console.log('✅ SAVE COMPLETED SUCCESSFULLY');
      toast({
        title: "Uppdaterat",
        description: "Hämtning har uppdaterats framgångsrikt"
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('🔴 SAVE ERROR:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera hämtningen",
        variant: "destructive"
      });
    } finally {
      console.log('🔴 RESETTING LOADING STATE');
      setLoading(false);
    }
  };

  if (!pickup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Redigera hämtning</DialogTitle>
          <DialogDescription>
            Uppdatera information för {pickup.owner_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Kundinformation</h3>
            
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Namn</p>
                  <p className="font-semibold">{pickup.owner_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{pickup.contact_phone || 'Ej angivet'}</p>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">Hämtadress</p>
                <p className="font-medium">{pickup.pickup_address || 'Ej angivet'}</p>
              </div>
            </div>
          </div>

          {/* Car Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bilinformation</h3>
            
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Märke</p>
                  <p className="font-medium">{pickup.car_brand}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modell</p>
                  <p className="font-medium">{pickup.car_model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">År</p>
                  <p className="font-medium">{pickup.car_year || 'Ej angivet'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm text-muted-foreground">Registreringsnummer</p>
                  <p className="font-medium">{pickup.car_registration_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{pickup.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Schemaläggning</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Hämtningsdatum
                </Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tid
                </Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Driver Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Förartilldelning</h3>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Förare
              </Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
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
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Värdering</h3>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Ersättning (kr)
              </Label>
              <Input
                type="number"
                value={reimbursement}
                onChange={(e) => setReimbursement(e.target.value)}
                placeholder="Ange ersättning"
                className="bg-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading} 
              className="bg-tenant-primary hover:bg-tenant-primary/90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Spara ändringar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};