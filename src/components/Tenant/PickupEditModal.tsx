import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DriverStatusManager } from '@/services/DriverStatusManager';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  
  // Form state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [reimbursement, setReimbursement] = useState('');
  const [pickupStatus, setPickupStatus] = useState('');
  
  // Editable customer and car information
  const [ownerName, setOwnerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [pickupStreetAddress, setPickupStreetAddress] = useState('');
  const [pickupPostalCode, setPickupPostalCode] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [carRegistration, setCarRegistration] = useState('');

  // Load initial data when pickup changes
  useEffect(() => {
    if (pickup && isOpen) {
      console.log('🔴 MODAL OPENED WITH PICKUP:', pickup);
      console.log('🔴 PICKUP.DRIVER_ID:', pickup?.driver_id);
      console.log('🔴 TYPEOF DRIVER_ID:', typeof pickup?.driver_id);
      
      setScheduleDate((pickup.scheduled_pickup_date || pickup.pickup_date || pickup.request_created_at?.split('T')[0]) || format(new Date(), 'yyyy-MM-dd'));
      setReimbursement(pickup.quote_amount?.toString() || '');
      const initialStatus = pickup.current_status || pickup.status || 'pending';
      setPickupStatus(initialStatus === 'confirmed' ? 'assigned' : initialStatus);
      
      // Initialize editable fields
      setOwnerName(pickup.owner_name || '');
      setContactPhone(pickup.contact_phone || '');
      
      // Parse address data - prioritize individual fields, fallback to parsing pickup_address
      if (pickup.pickup_street_address) {
        setPickupStreetAddress(pickup.pickup_street_address);
      } else if (pickup.pickup_address) {
        // Parse the full address "sveavägen 22, 12323 Stockholm" to extract street
        const addressParts = pickup.pickup_address.split(',');
        if (addressParts.length >= 2) {
          setPickupStreetAddress(addressParts[0]?.trim() || '');
        } else {
          setPickupStreetAddress(pickup.pickup_address);
        }
      } else {
        setPickupStreetAddress('');
      }
      
      if (pickup.pickup_postal_code) {
        setPickupPostalCode(pickup.pickup_postal_code);
      } else if (pickup.pickup_address) {
        // Parse postal code from "sveavägen 22, 12323 Stockholm" 
        const addressParts = pickup.pickup_address.split(',');
        if (addressParts.length >= 2) {
          const postcodeAndCity = addressParts[1]?.trim().split(' ');
          if (postcodeAndCity && postcodeAndCity.length > 0) {
            setPickupPostalCode(postcodeAndCity[0] || '');
          }
        }
      } else {
        setPickupPostalCode('');
      }
      
      if (pickup.pickup_city) {
        setPickupCity(pickup.pickup_city);
      } else if (pickup.pickup_address) {
        // Parse city from "sveavägen 22, 12323 Stockholm"
        const addressParts = pickup.pickup_address.split(',');
        if (addressParts.length >= 2) {
          const postcodeAndCity = addressParts[1]?.trim().split(' ');
          if (postcodeAndCity && postcodeAndCity.length > 1) {
            setPickupCity(postcodeAndCity.slice(1).join(' ') || '');
          }
        }
      } else {
        setPickupCity('');
      }
      
      setCarBrand(pickup.car_brand || '');
      setCarModel(pickup.car_model || '');
      setCarYear(pickup.car_year?.toString() || '');
      setCarRegistration(pickup.car_registration_number || '');
      
      // Set driver ID directly from pickup data (prefer assigned_driver_id)
      const driverId = pickup.assigned_driver_id || pickup.driver_id;
      if (driverId) {
        console.log('🟢 SETTING DRIVER ID FROM PICKUP:', driverId);
        setSelectedDriverId(driverId);
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
      setPickupStatus('');
      setOwnerName('');
      setContactPhone('');
      setPickupStreetAddress('');
      setPickupPostalCode('');
      setPickupCity('');
      setCarBrand('');
      setCarModel('');
      setCarYear('');
      setCarRegistration('');
      setLoading(false);
    }
  }, [pickup, isOpen]);

  // Removed fetchCurrentDriverAssignment - no longer needed as we get driver_id directly from parent

  const fetchDrivers = async () => {
    try {
      const tenantId = user?.tenant_id;
      console.log('🔴 FETCHING DRIVERS FOR TENANT:', tenantId);
      
      if (!tenantId) {
        console.error('🔴 NO TENANT ID FOUND');
        return;
      }
      
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, phone_number, driver_status')
        .eq('tenant_id', tenantId)
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
      console.log('🔴 SAVE STARTED for pickup:', pickup.customer_request_id);

      // First verify the customer request exists
      console.log('🔴 VERIFYING CUSTOMER REQUEST EXISTS...');
      const { data: existingRequest, error: verifyError } = await supabase
        .from('customer_requests')
        .select('id, tenant_id')
        .eq('id', pickup.customer_request_id)
        .maybeSingle();

      if (verifyError) {
        console.error('🔴 ERROR VERIFYING CUSTOMER REQUEST:', verifyError);
        throw verifyError;
      }

      if (!existingRequest) {
        console.error('🔴 CUSTOMER REQUEST NOT FOUND:', pickup.customer_request_id);
        throw new Error(`Customer request ${pickup.customer_request_id} not found`);
      }

      console.log('✅ CUSTOMER REQUEST EXISTS:', existingRequest);

      // Update customer_requests with quote_amount
      console.log('🔴 UPDATING CUSTOMER REQUEST WITH QUOTE AMOUNT:', reimbursement);
      const { error: updateRequestError } = await supabase
        .from('customer_requests')
        .update({
          quote_amount: reimbursement ? parseFloat(reimbursement) : null,
          owner_name: ownerName,
          contact_phone: contactPhone,
          pickup_street_address: pickupStreetAddress,
          pickup_postal_code: pickupPostalCode,
          pickup_city: pickupCity,
          pickup_address: `${pickupStreetAddress}, ${pickupPostalCode} ${pickupCity}`.trim(),
          car_brand: carBrand,
          car_model: carModel,
          car_year: carYear ? parseInt(carYear) : null,
          car_registration_number: carRegistration
        })
        .eq('id', pickup.customer_request_id);

      if (updateRequestError) {
        console.error('🔴 ERROR UPDATING CUSTOMER REQUEST:', updateRequestError);
        throw updateRequestError;
      }
      console.log('✅ CUSTOMER REQUEST UPDATED WITH QUOTE AMOUNT');

      // Ensure pickup_order exists and update status
      console.log('🔴 ENSURING PICKUP ORDER EXISTS...');
      console.log('🔴 PICKUP OBJECT:', pickup);
      
      // First, try to find existing pickup_order
      let { data: pickupOrderRow, error: lookupError } = await supabase
        .from('pickup_orders')
        .select('id')
        .eq('customer_request_id', pickup.customer_request_id)
        .maybeSingle();
        
      if (lookupError) {
        console.error('🔴 ERROR LOOKING UP PICKUP ORDER:', lookupError);
        throw lookupError;
      }
      
      let pickupOrderId = pickupOrderRow?.id;
      
      // Create pickup_order if it doesn't exist
      if (!pickupOrderId) {
        console.log('🔴 CREATING NEW PICKUP ORDER...');
        const { data: newPickupOrder, error: createError } = await supabase
          .from('pickup_orders')
          .insert({
            customer_request_id: pickup.customer_request_id,
            tenant_id: existingRequest.tenant_id || user?.tenant_id || 1,
            status: pickupStatus,
            scheduled_pickup_date: scheduleDate,
            final_price: reimbursement ? parseFloat(reimbursement) : null
          })
          .select('id')
          .single();
          
        if (createError) {
          console.error('🔴 ERROR CREATING PICKUP ORDER:', createError);
          throw createError;
        }
        
        pickupOrderId = newPickupOrder.id;
        console.log('✅ PICKUP ORDER CREATED:', pickupOrderId);
      } else {
      // Update existing pickup_order status and reimbursement
        console.log('🔴 UPDATING EXISTING PICKUP ORDER STATUS to:', pickupStatus);
        const { error: statusUpdateError } = await supabase
          .from('pickup_orders')
          .update({ 
            status: pickupStatus,
            scheduled_pickup_date: scheduleDate,
            final_price: reimbursement ? parseFloat(reimbursement) : null
          })
          .eq('id', pickupOrderId);

        if (statusUpdateError) {
          console.error('🔴 ERROR UPDATING PICKUP STATUS:', statusUpdateError);
          throw statusUpdateError;
        }
        console.log('✅ PICKUP ORDER STATUS UPDATED');
      }

      // Handle driver assignment/unassignment
      console.log('🔴 HANDLING DRIVER ASSIGNMENT, selectedDriverId:', selectedDriverId);
      
      if (selectedDriverId === 'none') {
        console.log('🔴 UNASSIGNING DRIVER PATH');
        
        // Deactivate any existing active assignments by pickup_order_id and customer_request_id
        console.log('🔴 DEACTIVATING DRIVER ASSIGNMENTS...');
        if (pickupOrderId) {
          const { error: unassignByOrderError } = await supabase
            .from('driver_assignments')
            .update({ is_active: false })
            .eq('pickup_order_id', pickupOrderId)
            .eq('is_active', true);
          if (unassignByOrderError) {
            console.error('🔴 ERROR UNASSIGNING (by order):', unassignByOrderError);
            throw unassignByOrderError;
          }
        }
        const { error: unassignByReqError } = await supabase
          .from('driver_assignments')
          .update({ is_active: false })
          .eq('customer_request_id', pickup.customer_request_id)
          .eq('is_active', true);
 
        if (unassignByReqError) {
          console.error('🔴 ERROR UNASSIGNING (by request):', unassignByReqError);
          throw unassignByReqError;
        }
        console.log('✅ DRIVER ASSIGNMENTS DEACTIVATED');

        // Also clear assigned_driver_id on pickup_orders to reflect unassignment immediately
        if (pickupOrderId) {
          const { error: clearAssignedErr } = await supabase
            .from('pickup_orders')
            .update({ assigned_driver_id: null })
            .eq('id', pickupOrderId);
          if (clearAssignedErr) {
            console.error('🔴 ERROR CLEARING assigned_driver_id:', clearAssignedErr);
            throw clearAssignedErr;
          }
          console.log('✅ Cleared assigned_driver_id on pickup_orders');
        }

        // Status already handled above via pickupStatus; no extra update here
        console.log('⏭️ SKIPPING EXTRA STATUS UPDATE - DRIVER UNASSIGNED');

      } else if (selectedDriverId && selectedDriverId !== 'none') {
        console.log('🔴 ASSIGNING DRIVER PATH:', selectedDriverId);
        
        // ASSIGN DRIVER CASE - First deactivate any existing assignments
        console.log('🔴 DEACTIVATING EXISTING ASSIGNMENTS...');
        // Deactivate by pickup_order_id first (if exists), then by customer_request_id
        if (pickupOrderId) {
          const { error: deactivateByOrder } = await supabase
            .from('driver_assignments')
            .update({ is_active: false })
            .eq('pickup_order_id', pickupOrderId)
            .eq('is_active', true);
          if (deactivateByOrder) {
            console.error('🔴 ERROR DEACTIVATING (by order):', deactivateByOrder);
            throw deactivateByOrder;
          }
        }
        const { error: deactivateByRequest } = await supabase
          .from('driver_assignments')
          .update({ is_active: false })
          .eq('customer_request_id', pickup.customer_request_id)
          .eq('is_active', true);
        if (deactivateByRequest) {
          console.error('🔴 ERROR DEACTIVATING (by request):', deactivateByRequest);
          throw deactivateByRequest;
        }
        console.log('✅ EXISTING ASSIGNMENTS DEACTIVATED');

        // Check if an active assignment still exists (race protection)
        console.log('🔍 CHECKING EXISTING ACTIVE ASSIGNMENT...');
        let existingActive: { id: string; driver_id: string } | null = null;
        if (pickupOrderId) {
          const { data: ex1, error: exErr1 } = await supabase
            .from('driver_assignments')
            .select('id, driver_id')
            .eq('pickup_order_id', pickupOrderId)
            .eq('is_active', true)
            .maybeSingle();
          if (exErr1) {
            console.error('🔴 ERROR FETCHING EXISTING ASSIGNMENT (by order):', exErr1);
            throw exErr1;
          }
          existingActive = ex1 as any;
        } else {
          const { data: ex2, error: exErr2 } = await supabase
            .from('driver_assignments')
            .select('id, driver_id')
            .eq('customer_request_id', pickup.customer_request_id)
            .eq('is_active', true)
            .maybeSingle();
          if (exErr2) {
            console.error('🔴 ERROR FETCHING EXISTING ASSIGNMENT (by request):', exErr2);
            throw exErr2;
          }
          existingActive = ex2 as any;
        }

        if (existingActive) {
          if (existingActive.driver_id !== selectedDriverId) {
            const { error: updateAssignErr } = await supabase
              .from('driver_assignments')
              .update({ driver_id: selectedDriverId })
              .eq('id', existingActive.id);
            if (updateAssignErr) {
              console.error('🔴 ERROR UPDATING EXISTING ASSIGNMENT:', updateAssignErr);
              throw updateAssignErr;
            }
            console.log('✅ UPDATED EXISTING ASSIGNMENT DRIVER');
          } else {
            console.log('ℹ️ Assignment already up to date');
          }
        } else {
          // Create new assignment using pickup_order_id
          console.log('🔴 CREATING NEW ASSIGNMENT...');
          const assignmentData: any = {
            customer_request_id: pickup.customer_request_id,
            driver_id: selectedDriverId,
            role: 'primary',
            assignment_type: 'pickup',
            is_active: true,
          };
          if (pickupOrderId) assignmentData.pickup_order_id = pickupOrderId;

          const { error: assignmentError } = await supabase
            .from('driver_assignments')
            .insert(assignmentData);
          if (assignmentError) {
            console.error('🔴 ERROR CREATING ASSIGNMENT:', assignmentError);
            throw assignmentError;
          }
          console.log('✅ NEW ASSIGNMENT CREATED');
        }

        // Reflect assignment on pickup_orders for immediate UI consistency
        if (pickupOrderId) {
          const { error: setAssignedErr } = await supabase
            .from('pickup_orders')
            .update({ assigned_driver_id: selectedDriverId })
            .eq('id', pickupOrderId);
          if (setAssignedErr) {
            console.error('🔴 ERROR SETTING assigned_driver_id:', setAssignedErr);
            throw setAssignedErr;
          }
          console.log('✅ Updated pickup_orders.assigned_driver_id');
        }

        console.log('⏭️ STATUS already set via pickupStatus; no extra update here');
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
    } catch (error: any) {
      console.error('🔴 SAVE ERROR:', error);
      toast({
        title: 'Fel',
        description: `Kunde inte uppdatera hämtningen: ${error?.message || error?.details || 'okänt fel'}`,
        variant: 'destructive'
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner_name">Namn</Label>
                <Input
                  id="owner_name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="För- och efternamn"
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefon</Label>
                <Input
                  id="contact_phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="08-123 45 67"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Hämtadress</h4>
              <div className="space-y-2">
                <Label htmlFor="pickup_street_address">Gatuadress</Label>
                <Input
                  id="pickup_street_address"
                  value={pickupStreetAddress}
                  onChange={(e) => setPickupStreetAddress(e.target.value)}
                  placeholder="Gatuadress och nummer"
                  className="bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup_postal_code">Postnummer</Label>
                  <Input
                    id="pickup_postal_code"
                    value={pickupPostalCode}
                    onChange={(e) => setPickupPostalCode(e.target.value)}
                    placeholder="12345"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup_city">Ort</Label>
                  <Input
                    id="pickup_city"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    placeholder="Stockholm"
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Car Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bilinformation</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="car_brand">Märke</Label>
                <Input
                  id="car_brand"
                  value={carBrand}
                  onChange={(e) => setCarBrand(e.target.value)}
                  placeholder="Volvo"
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="car_model">Modell</Label>
                <Input
                  id="car_model"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="V70"
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="car_year">År</Label>
                <Input
                  id="car_year"
                  type="number"
                  value={carYear}
                  onChange={(e) => setCarYear(e.target.value)}
                  placeholder="2010"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="car_registration">Registreringsnummer</Label>
                <Input
                  id="car_registration"
                  value={carRegistration}
                  onChange={(e) => setCarRegistration(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={pickupStatus} onValueChange={setPickupStatus}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Välj status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="pending">Väntande</SelectItem>
                    <SelectItem value="assigned">Bekräftad</SelectItem>
                    <SelectItem value="scheduled">Schemalagd</SelectItem>
                    <SelectItem value="assigned">Tilldelad</SelectItem>
                    <SelectItem value="in_progress">Pågående</SelectItem>
                    <SelectItem value="completed">Slutförd</SelectItem>
                    <SelectItem value="cancelled">Avbruten</SelectItem>
                    <SelectItem value="rejected">Avvisad</SelectItem>
                  </SelectContent>
                </Select>
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
              <Select value={selectedDriverId} onValueChange={(value) => {
                setSelectedDriverId(value);
                // Update status based on driver assignment
                if (value === 'none') {
                  setPickupStatus('pending');
                } else {
                  setPickupStatus('assigned');
                }
              }}>
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
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  disabled={loading} 
                  className="bg-tenant-primary hover:bg-tenant-primary/90"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Spara ändringar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bekräfta ändringar</AlertDialogTitle>
                  <AlertDialogDescription>
                    Är du säker allt är rätt? Alla ändringar kommer att sparas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleSave}
                    className="bg-tenant-primary hover:bg-tenant-primary/90"
                  >
                    Ok
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};