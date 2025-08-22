import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, DollarSign } from 'lucide-react';
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
      console.log('🔴 SELECTED_DRIVER_ID STATE:', selectedDriverId);
      
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
          const { error: statusError } = await (supabase as any).rpc('update_pickup_status_unified', {
            pickup_id: pickup.id,
            new_status: 'scheduled'
          });

          if (statusError) {
            console.error('🔴 ERROR UPDATING STATUS TO SCHEDULED:', statusError);
            throw statusError;
          }
          console.log('✅ STATUS UPDATED TO SCHEDULED');
        } else {
          console.log('⏭️ SKIPPING STATUS UPDATE - PICKUP IS CANCELLED');
        }

      } else if (selectedDriverId) {
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
          const { error: statusError } = await (supabase as any).rpc('update_pickup_status_unified', {
            pickup_id: pickup.id,
            new_status: 'assigned'
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

      toast({
        title: "Uppdaterat",
        description: "Hämtning har uppdaterats framgångsrikt"
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating pickup:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera hämtningen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!pickup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Redigera hämtning</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="font-semibold">{pickup.owner_name}</p>
            <p className="text-sm text-muted-foreground">
              {pickup.car_brand} {pickup.car_model} ({pickup.car_registration_number})
            </p>
            <p className="text-sm text-muted-foreground">{pickup.pickup_address}</p>
          </div>

          {/* Schedule Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Hämtningsdatum
            </Label>
            <Input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>

          {/* Schedule Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tid
            </Label>
            <Input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>

          {/* Driver Assignment */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Förare
            </Label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Välj förare (valfritt)" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="none">Ingen förare tilldelad</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.full_name} - {driver.driver_status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reimbursement */}
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
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Avbryt
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading} 
              className="flex-1"
            >
              {loading ? 'Sparar...' : 'Spara'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};