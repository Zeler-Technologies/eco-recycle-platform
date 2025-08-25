
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Driver {
  id: string;
  driver_id: string;
  auth_user_id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  vehicle_type?: string;
  vehicle_registration?: string;
  driver_status: string;
  status: string;
  current_latitude?: number;
  current_longitude?: number;
  is_active: boolean;
  tenant_id: number;
  scrapyard_id?: number;
  max_capacity_kg?: number;
  last_location_update?: string;
  created_at: string;
  updated_at?: string;
}

interface PickupOrder {
  id: string;
  pickup_id: string;
  pickup_order_id?: string; // ✅ ADD THIS FIELD
  customer_request_id?: string;
  car_registration_number: string;
  car_year?: number;
  car_brand: string;
  car_model: string;
  owner_name: string;
  contact_phone?: string; // ✅ ADD MISSING PHONE FIELD
  pickup_address: string;
  pickup_postal_code?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pnr_num?: string;
  pickup_status?: string;
  scheduled_pickup_date?: string;
  final_price?: number;
  driver_notes?: string;
  completion_photos?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  assigned_at?: string;
  assignment_active?: boolean;
  assignment_notes?: string;
  tenant_id?: number;
  scrapyard_id?: number;
  status_display_text?: string;
  vehicle_year?: number;
  vehicle_make: string;
  vehicle_model: string;
  fuel_type?: string;
  pickup_distance?: number;
  customer_name: string;
  pickup_location: string;
  estimated_arrival?: string;
  scheduled_at?: string;
  completion_notes?: string;
  assigned_driver_id?: string;
}

interface StatusHistoryItem {
  id: string;
  driver_id: string;
  old_status?: string;
  new_status: string;
  changed_at: string;
  changed_by?: string;
  source?: string;
  reason?: string;
  metadata?: any;
}

export const useDriverIntegration = () => {
  const queryClient = useQueryClient();
  const [pickups, setPickups] = useState<PickupOrder[]>([]);
  const [availablePickups, setAvailablePickups] = useState<PickupOrder[]>([]);
  const [assignedPickups, setAssignedPickups] = useState<PickupOrder[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Load current driver information using real Supabase auth
  const { user, session } = useAuth();
  
  const loadDriverInfo = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        throw new Error('No authenticated user found');
      }
      
      // Find driver by auth_user_id (real authentication)
      const { data: directDriverData, error: directError } = await supabase
        .from('drivers')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (directError) {
        throw new Error(`No driver found for user ${session.user.email}: ${directError.message}`);
      }

      // Map the direct query result to match expected format
      const mappedDriver: Driver = {
        ...directDriverData,
        driver_id: directDriverData.id,
        status: directDriverData.driver_status
      };
      setDriver(mappedDriver);

    } catch (err) {
      console.error('Error loading driver info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load driver information');
    }
  }, [session?.user?.id]);

  // Load pickups using unified view
  const loadPickups = useCallback(async (driverId?: string) => {
    if (!driverId) {
      console.log('🔴 LOAD PICKUPS - NO DRIVER ID PROVIDED');
      return;
    }

    console.log('🔴 LOADING PICKUPS - START for driver:', driverId);
    try {
      console.log('🔄 Loading pickups for driver:', driverId);
      
      // Get driver's tenant info first
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('tenant_id, scrapyard_id')
        .eq('id', driverId)
        .single();

      if (driverError) {
        throw new Error(`Failed to get driver tenant info: ${driverError.message}`);
      }

      // Use unified view to get all pickups for the driver's tenant/scrapyard
      const { data, error } = await (supabase as any)
        .from('v_pickup_status_unified')
        .select('*')
        .eq('tenant_id', driverData.tenant_id)
        .order('created_at', { ascending: false });

      console.log('🔴 SUPABASE RESULT:', { data, error });
      console.log('🔴 DATA COUNT:', data?.length);

      if (error) {
        console.error('❌ Error loading pickups:', error);
        console.error('🔴 LOAD PICKUPS ERROR:', error);
        throw error;
      }

      console.log('✅ Unified pickup data loaded:', data);
      
      // Process and set the pickup data with unified fields
      const processedPickups: PickupOrder[] = (data || []).map((pickup: any) => ({
        id: pickup.pickup_order_id || pickup.id,
        pickup_id: pickup.pickup_order_id || pickup.id,
        pickup_order_id: pickup.pickup_order_id, // ✅ KEEP THIS FIELD
        customer_request_id: pickup.customer_request_id,
        car_registration_number: pickup.car_registration_number || '',
        car_year: pickup.car_year,
        car_brand: pickup.car_brand || '',
        car_model: pickup.car_model || '',
        owner_name: pickup.owner_name || '',
        contact_phone: pickup.contact_phone, // ✅ ADD MISSING PHONE FIELD
        pickup_address: pickup.pickup_address || '',
        pickup_postal_code: pickup.pickup_postal_code,
        pickup_latitude: pickup.pickup_latitude,
        pickup_longitude: pickup.pickup_longitude,
        pnr_num: pickup.pnr_num,
        pickup_status: pickup.pickup_status,
        scheduled_pickup_date: pickup.scheduled_pickup_date,
        final_price: pickup.final_price,
        driver_notes: pickup.driver_notes,
        completion_photos: pickup.completion_photos,
        status: pickup.pickup_status, // Use pickup_status from unified view
        created_at: pickup.created_at,
        updated_at: pickup.updated_at,
        driver_id: pickup.driver_id,
        driver_name: pickup.driver_name,
        driver_phone: pickup.driver_phone,
        assigned_at: pickup.assigned_at,
        assignment_active: pickup.assignment_active,
        assignment_notes: pickup.assignment_notes,
        tenant_id: pickup.tenant_id,
        scrapyard_id: pickup.scrapyard_id,
        status_display_text: pickup.status_display_text,
        vehicle_year: pickup.car_year,
        vehicle_make: pickup.car_brand || '',
        vehicle_model: pickup.car_model || '',
        fuel_type: 'gasoline',
        pickup_distance: 0,
        customer_name: pickup.owner_name || '',
        pickup_location: pickup.pickup_address || '',
        estimated_arrival: pickup.estimated_arrival,
        scheduled_at: pickup.scheduled_at,
        completion_notes: pickup.completion_photos?.join(', ') || '',
        assigned_driver_id: pickup.driver_id
      }));
      
      console.log('✅ Processed pickups:', processedPickups);
      setPickups(processedPickups);

    } catch (err) {
      console.error('❌ Failed to load pickups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pickup orders');
    }
  }, []);

  // Load status history for the driver
  const loadStatusHistory = useCallback(async (driverId?: string) => {
    if (!driverId) return;

    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('driver_status_history')
        .select('id, driver_id, old_status, new_status, changed_at, source, reason')
        .eq('driver_id', driverId)
        .order('changed_at', { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(`Failed to load status history: ${error.message}`);
      }

      setStatusHistory(data || []);
    } catch (err) {
      console.error('Error loading status history:', err);
      // Don't set error for status history, it's not critical
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Update driver status
  const updateDriverStatus = useCallback(async (driverId: string, status: string) => {
    try {
      // Call the existing edge function
      const response = await supabase.functions.invoke('update-driver-status', {
        body: {
          driverId,
          newStatus: status,
          reason: 'Manual status change'
        }
      });

      if (response.error) {
        throw new Error(`Failed to update status: ${response.error.message}`);
      }

      // Optimistically update local state
      setDriver(prev => prev ? { ...prev, status, driver_status: status } : null);

      // Reload status history to get the latest entry
      await loadStatusHistory(driverId);

      return response.data;
    } catch (err) {
      console.error('Error updating driver status:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update driver status');
    }
  }, [loadStatusHistory]);

  // Update pickup status using CORRECTED unified database function
  const updatePickupStatus = useCallback(async (pickupId: string, status: string, notes?: string) => {
    console.log('📞 updatePickupStatus called with:', { pickupId, status, notes });
    
    if (!driver?.driver_id) {
      console.error('❌ No driver ID available');
      throw new Error('Driver ID not available');
    }

    try {
      // Use the corrected function name with proper parameters
      const { data, error } = await (supabase as any).rpc('update_pickup_status_yesterday_workflow', {
        p_pickup_order_id: pickupId,
        p_new_status: status,
        p_driver_notes: notes || null,
        p_completion_photos: null,
        p_test_driver_id: null // Will use authenticated user
      });
      
      if (error) {
        console.error('❌ Status update failed:', error);
        throw error;
      }
      
      console.log('✅ Status updated successfully:', data);

      // Optimistic UI update - set both status and pickup_status for immediate feedback
      setPickups(prev => prev.map(pickup => 
        pickup.id === pickupId 
          ? { ...pickup, status, pickup_status: status, driver_notes: notes }
          : pickup
      ));

      // Refresh data after update
      await loadPickups(driver.driver_id);
      
      // Post-refresh console summary
      const updatedPickup = pickups.find(p => p.id === pickupId);
      if (updatedPickup) {
        console.log('🔄 PICKUP STATUS UPDATE SUMMARY:', {
          pickupId,
          oldStatus: updatedPickup.status,
          newStatus: status,
          timestamp: new Date().toISOString()
        });
      }
      
      // Invalidate related queries to refresh other views
      await queryClient.invalidateQueries({ queryKey: ['pickup-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['customer-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['tenant-customers'] });

      return { success: true };
    } catch (err) {
      console.error('❌ Error updating pickup status:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update pickup status');
    }
  }, [driver?.driver_id, loadPickups, queryClient]);

  // Other hook methods (keeping existing signatures for compatibility)
  const assignDriver = useCallback(async (orderId: string, driverId: string) => {
    await updatePickupStatus(orderId, 'assigned', `Assigned to driver ${driverId}`);
  }, [updatePickupStatus]);

  const unassignDriver = useCallback(async (orderId: string) => {
    await updatePickupStatus(orderId, 'pending', 'Driver unassigned');
  }, [updatePickupStatus]);


  const calculateOrderPrice = useCallback(async (order: any) => {
    setIsCalculatingPrice(true);
    setPricingError(null);
    
    try {
      // Simulate pricing calculation or call actual pricing API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const basePrice = Math.floor(Math.random() * 5000) + 2000;
      return {
        basePrice,
        totalPrice: basePrice,
        breakdown: {
          scrapValue: basePrice * 0.8,
          transportFee: basePrice * 0.2
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate price';
      setPricingError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCalculatingPrice(false);
    }
  }, []);

  const updateOrderPricing = useCallback(async (orderId: string, vehicleInfo: any, basePrice?: number) => {
    try {
      const { error } = await supabase
        .from('pickup_orders')
        .update({ 
          final_price: basePrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        throw new Error(`Failed to update order pricing: ${error.message}`);
      }

      // Update local state
      setPickups(prev => prev.map(pickup => 
        pickup.id === orderId 
          ? { ...pickup, final_price: basePrice }
          : pickup
      ));

    } catch (err) {
      console.error('Error updating order pricing:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update order pricing');
    }
  }, []);

  const bulkCalculatePricing = useCallback(async (orders: any[]) => {
    // Placeholder for bulk pricing calculations
    return orders.map(order => ({
      orderId: order.id,
      price: Math.floor(Math.random() * 5000) + 2000
    }));
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await loadDriverInfo();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  }, [loadDriverInfo]);

  // Self-assign driver to unassigned pickup
  const selfAssignPickup = useCallback(async (pickupId: string) => {
    if (!driver?.id) {
      throw new Error('No driver available for assignment');
    }

    try {
      // Update the pickup order to assign this driver
      const { error: updateError } = await supabase
        .from('pickup_orders')
        .update({
          assigned_driver_id: driver.id,
          status: 'assigned',
          driver_notes: 'Self-assigned by driver',
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupId);

      if (updateError) {
        throw new Error(`Failed to self-assign pickup: ${updateError.message}`);
      }

      // Create driver assignment record
      const { error: assignmentError } = await supabase
        .from('driver_assignments')
        .insert({
          driver_id: driver.id,
          pickup_order_id: pickupId,
          assigned_at: new Date().toISOString(),
          status: 'scheduled',
          assignment_type: 'pickup',
          role: 'primary',
          is_active: true
        });

      if (assignmentError) {
        console.warn('Failed to create assignment record:', assignmentError.message);
      }

      // Refresh data
      await refreshData();
      return true;

    } catch (err) {
      console.error('Error self-assigning pickup:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to self-assign pickup');
    }
  }, [driver?.id, refreshData]);

  // Reject/disapprove assigned pickup
  const rejectAssignedPickup = useCallback(async (pickupId: string, reason?: string) => {
    console.log('🔴 rejectAssignedPickup called with:', { pickupId, reason, driverId: driver?.id });
    
    if (!driver?.id) {
      throw new Error('No driver available');
    }

    try {
      // First get the pickup order to find the customer request ID
      console.log('📍 Step 1: Fetching pickup order...');
      const { data: pickupOrder, error: fetchError } = await supabase
        .from('pickup_orders')
        .select('customer_request_id, status, assigned_driver_id')
        .eq('id', pickupId)
        .single();

      console.log('📍 Step 1 result:', { pickupOrder, fetchError });

      if (fetchError) {
        throw new Error(`Failed to find pickup order: ${fetchError.message}`);
      }

      // Update the pickup order to unassign driver and set status to rejected
      console.log('📍 Step 2: Updating pickup_orders status to rejected...');
      const { error: updateError } = await supabase
        .from('pickup_orders')
        .update({
          assigned_driver_id: null,
          status: 'rejected',
          driver_notes: reason || 'Rejected by driver',
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupId)
        .eq('assigned_driver_id', driver.id);

      console.log('📍 Step 2 result:', { updateError });
      if (updateError) {
        throw new Error(`Failed to reject pickup: ${updateError.message}`);
      }

      // Also update the customer request status to rejected
      if (pickupOrder.customer_request_id) {
        console.log('📍 Step 3: Updating customer_requests status to rejected...');
        const { error: requestError } = await supabase
          .from('customer_requests')
          .update({
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', pickupOrder.customer_request_id);

        console.log('📍 Step 3 result:', { requestError });
        if (requestError) {
          console.error('Failed to update customer request status:', requestError);
          // Don't throw error here as the main pickup rejection succeeded
        }
      }

      // Update driver assignment for THIS SPECIFIC pickup only
      console.log('📍 Step 4: Updating driver assignment status...');
      const { error: assignmentError } = await supabase
        .from('driver_assignments')
        .update({
          is_active: false,
          status: 'canceled',
          completed_at: new Date().toISOString(),
          notes: reason || 'Rejected by driver'
        })
        .eq('pickup_order_id', pickupId)    // Target specific pickup
        .eq('driver_id', driver.id)         // AND specific driver
        .eq('is_active', true);             // AND only active assignments

      console.log('📍 Step 4 result:', { assignmentError });
      if (assignmentError) {
        console.warn('Failed to update assignment record:', assignmentError.message);
      }

      // Optimistic UI update
      setPickups(prev => prev.map(pickup => 
        pickup.id === pickupId 
          ? { ...pickup, status: 'rejected', assigned_driver_id: null }
          : pickup
      ));

      // Invalidate queries to refresh all views
      await queryClient.invalidateQueries({ queryKey: ['pickup-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['customer-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['tenant-customers'] });

      // Refresh data with small delay
      if (driver?.driver_id) {
        setTimeout(() => loadPickups(driver.driver_id), 200);
      }

      console.log('✅ Pickup rejection completed successfully');
      return true;

    } catch (err) {
      console.error('Error rejecting pickup:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to reject pickup');
    }
  }, [driver?.id, refreshData]);

  // Load available pickups (unassigned, scheduled pickups for self-assignment)
  const loadAvailablePickups = useCallback(async () => {
    if (!driver?.tenant_id) {
      console.log('❌ No tenant ID available for available pickups');
      return;
    }

    setLoadingAvailable(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('🔄 Loading available pickups for tenant:', driver.tenant_id, 'date:', today);
      
      const { data, error } = await (supabase as any)
        .from('v_pickup_status_unified')
        .select('*')
        .eq('tenant_id', driver.tenant_id)
        .in('pickup_status', ['scheduled', 'pending'])
        .or(`driver_id.is.null,driver_id.neq.${driver.id}`)
        .gte('scheduled_pickup_date', today)
        .order('scheduled_pickup_date', { ascending: true })
        .order('created_at', { ascending: true });
      
      console.log('🔄 AVAILABLE PICKUPS QUERY RESULT:', { data, error, tenant_id: driver.tenant_id, today });
      
      if (error) throw error;
      
      const processedAvailable: PickupOrder[] = (data || []).map((pickup: any) => ({
        id: pickup.pickup_order_id || pickup.id,
        pickup_id: pickup.pickup_order_id || pickup.id,
        pickup_order_id: pickup.pickup_order_id,
        customer_request_id: pickup.customer_request_id,
        car_registration_number: pickup.car_registration_number || '',
        car_year: pickup.car_year,
        car_brand: pickup.car_brand || '',
        car_model: pickup.car_model || '',
        owner_name: pickup.owner_name || '',
        contact_phone: pickup.contact_phone,
        pickup_address: pickup.pickup_address || '',
        pickup_postal_code: pickup.pickup_postal_code,
        pickup_latitude: pickup.pickup_latitude,
        pickup_longitude: pickup.pickup_longitude,
        pnr_num: pickup.pnr_num,
        pickup_status: pickup.pickup_status,
        scheduled_pickup_date: pickup.scheduled_pickup_date,
        final_price: pickup.final_price,
        driver_notes: pickup.driver_notes,
        completion_photos: pickup.completion_photos,
        status: pickup.pickup_status,
        created_at: pickup.created_at,
        updated_at: pickup.updated_at,
        driver_id: pickup.driver_id,
        driver_name: pickup.driver_name,
        driver_phone: pickup.driver_phone,
        assigned_at: pickup.assigned_at,
        assignment_active: pickup.assignment_active,
        assignment_notes: pickup.assignment_notes,
        tenant_id: pickup.tenant_id,
        scrapyard_id: pickup.scrapyard_id,
        status_display_text: pickup.status_display_text,
        vehicle_year: pickup.car_year,
        vehicle_make: pickup.car_brand || '',
        vehicle_model: pickup.car_model || '',
        fuel_type: 'gasoline',
        pickup_distance: 0,
        customer_name: pickup.owner_name || '',
        pickup_location: pickup.pickup_address || '',
        estimated_arrival: pickup.estimated_arrival,
        scheduled_at: pickup.scheduled_at,
        completion_notes: pickup.completion_photos?.join(', ') || '',
        assigned_driver_id: pickup.driver_id
      }));
      
      console.log('✅ Available pickups loaded:', processedAvailable.length, processedAvailable);
      setAvailablePickups(processedAvailable);
    } catch (error) {
      console.error('❌ Failed to load available pickups:', error);
      setError(error instanceof Error ? error.message : 'Failed to load available pickups');
    } finally {
      setLoadingAvailable(false);
    }
  }, [driver?.tenant_id]);

  // Load assigned pickups (driver's assigned and in-progress pickups)
  const loadAssignedPickups = useCallback(async () => {
    if (!driver?.driver_id || !driver?.tenant_id) {
      console.log('❌ No driver ID or tenant ID available for assigned pickups');
      return;
    }

    setLoadingAssigned(true);
    try {
      console.log('🔄 Loading assigned pickups for driver:', driver.driver_id);
      console.log('🔄 Driver tenant ID:', driver.tenant_id);
      
      const { data, error } = await (supabase as any)
        .from('v_pickup_status_unified')
        .select('*')
        .eq('driver_id', driver.driver_id)
        .eq('tenant_id', driver.tenant_id)
        .in('pickup_status', ['assigned', 'in_progress', 'scheduled'])
        .order('scheduled_pickup_date', { ascending: true })
        .order('created_at', { ascending: true });
      
      console.log('🔄 ASSIGNED PICKUPS QUERY RESULT:', { data, error, driverId: driver.driver_id });
      
      if (error) throw error;
      
      const processedAssigned: PickupOrder[] = (data || []).map((pickup: any) => ({
        id: pickup.pickup_order_id || pickup.id,
        pickup_id: pickup.pickup_order_id || pickup.id,
        pickup_order_id: pickup.pickup_order_id,
        customer_request_id: pickup.customer_request_id,
        car_registration_number: pickup.car_registration_number || '',
        car_year: pickup.car_year,
        car_brand: pickup.car_brand || '',
        car_model: pickup.car_model || '',
        owner_name: pickup.owner_name || '',
        contact_phone: pickup.contact_phone,
        pickup_address: pickup.pickup_address || '',
        pickup_postal_code: pickup.pickup_postal_code,
        pickup_latitude: pickup.pickup_latitude,
        pickup_longitude: pickup.pickup_longitude,
        pnr_num: pickup.pnr_num,
        pickup_status: pickup.pickup_status,
        scheduled_pickup_date: pickup.scheduled_pickup_date,
        final_price: pickup.final_price,
        driver_notes: pickup.driver_notes,
        completion_photos: pickup.completion_photos,
        status: pickup.pickup_status,
        created_at: pickup.created_at,
        updated_at: pickup.updated_at,
        driver_id: pickup.driver_id,
        driver_name: pickup.driver_name,
        driver_phone: pickup.driver_phone,
        assigned_at: pickup.assigned_at,
        assignment_active: pickup.assignment_active,
        assignment_notes: pickup.assignment_notes,
        tenant_id: pickup.tenant_id,
        scrapyard_id: pickup.scrapyard_id,
        status_display_text: pickup.status_display_text,
        vehicle_year: pickup.car_year,
        vehicle_make: pickup.car_brand || '',
        vehicle_model: pickup.car_model || '',
        fuel_type: 'gasoline',
        pickup_distance: 0,
        customer_name: pickup.owner_name || '',
        pickup_location: pickup.pickup_address || '',
        estimated_arrival: pickup.estimated_arrival,
        scheduled_at: pickup.scheduled_at,
        completion_notes: pickup.completion_photos?.join(', ') || '',
        assigned_driver_id: pickup.driver_id
      }));
      
      console.log('✅ Assigned pickups loaded:', processedAssigned.length, processedAssigned);
      setAssignedPickups(processedAssigned);
    } catch (error) {
      console.error('❌ Failed to load assigned pickups:', error);
      setError(error instanceof Error ? error.message : 'Failed to load assigned pickups');
    } finally {
      setLoadingAssigned(false);
    }
  }, [driver?.driver_id, driver?.tenant_id]);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await loadDriverInfo();
      } catch (err) {
        console.error('Error initializing data:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [loadDriverInfo]);

  // Load pickups and status history when driver changes
  useEffect(() => {
    if (driver?.driver_id) {
      loadPickups(driver.driver_id);
      loadStatusHistory(driver.driver_id);
      // Load the new separated pickup lists
      loadAvailablePickups();
      loadAssignedPickups();
    }
  }, [driver?.driver_id, loadPickups, loadStatusHistory, loadAvailablePickups, loadAssignedPickups]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!driver?.driver_id) return;

    const driverId = driver.driver_id;

    // Subscribe to driver status changes
    const driverStatusChannel = supabase
      .channel(`driver-status-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${driverId}`
        },
        (payload) => {
          console.log('Driver status updated:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            setDriver(prev => prev ? {
              ...prev,
              ...newData,
              driver_id: newData.id || prev.driver_id,
              status: newData.driver_status || prev.status
            } : null);
          }
        }
      )
      .subscribe();

    // Subscribe to pickup order changes
    const pickupsChannel = supabase
      .channel(`driver-pickups-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pickup_orders',
          filter: `assigned_driver_id=eq.${driverId}`
        },
        (payload) => {
          console.log('Pickup orders updated:', payload);
          // Reload pickups when changes occur
          loadPickups(driverId);
        }
      )
      .subscribe();

    // Subscribe to status history changes
    const statusHistoryChannel = supabase
      .channel(`driver-history-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_status_history',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          console.log('Status history updated:', payload);
          if (payload.new) {
            setStatusHistory(prev => [payload.new as StatusHistoryItem, ...prev.slice(0, 9)]);
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(driverStatusChannel);
      supabase.removeChannel(pickupsChannel);
      supabase.removeChannel(statusHistoryChannel);
    };
  }, [driver?.driver_id, loadPickups]);


  // Get available pickups for self-assignment (backward compatibility)
  const getAvailablePickups = useCallback(async () => {
    await loadAvailablePickups();
    return availablePickups;
  }, [loadAvailablePickups, availablePickups]);

  // Enhanced self-assignment with proper error handling and UI feedback
  const handleSelfAssignment = useCallback(async (pickupOrderId: string, customerName: string) => {
    if (!driver?.driver_id) {
      throw new Error('Driver ID not available');
    }

    try {
      console.log(`🔄 Driver ${driver.driver_id} attempting self-assignment to pickup ${pickupOrderId}`);
      
      const { data, error } = await (supabase as any).rpc('update_pickup_status_yesterday_workflow', {
        p_pickup_order_id: pickupOrderId,
        p_new_status: 'assigned',
        p_driver_notes: `Självtilldelad av förare - ${new Date().toLocaleDateString('sv-SE')}`,
        p_completion_photos: null
      });

      if (error) {
        console.error('❌ Self-assignment database error:', error);
        
        if (error.message.includes('already assigned')) {
          throw new Error('Denna upphämtning har redan tilldelats en annan förare');
        } else if (error.message.includes('not found')) {
          throw new Error('Upphämtningen kunde inte hittas');
        } else {
          throw new Error('Kunde inte tilldela upphämtningen');
        }
      }

      console.log('✅ Self-assignment successful:', data);
      
      // Refresh both available and assigned pickups
      await Promise.all([
        loadAvailablePickups(),
        loadAssignedPickups()
      ]);
      
      return true;
    } catch (error) {
      console.error('❌ Self-assignment failed:', error);
      throw error;
    }
  }, [driver?.driver_id, loadAvailablePickups, loadAssignedPickups]);

  // Self-assign a pickup (backward compatibility)
  const selfAssign = useCallback(async (pickupId: string) => {
    console.log('🔄 Self-assigning pickup:', pickupId);
    return updatePickupStatus(pickupId, 'assigned', 'Self-assigned by driver');
  }, [updatePickupStatus]);

  // Refresh functions
  const refreshAvailablePickups = useCallback(() => loadAvailablePickups(), [loadAvailablePickups]);
  const refreshAssignedPickups = useCallback(() => loadAssignedPickups(), [loadAssignedPickups]);
  const refreshAllPickupData = useCallback(() => Promise.all([
    loadAvailablePickups(),
    loadAssignedPickups()
  ]), [loadAvailablePickups, loadAssignedPickups]);

  return {
    // Legacy data (maintain backward compatibility)
    pickups,
    driver,
    loading,
    error,
    statusHistory,
    historyLoading,
    isCalculatingPrice,
    pricingError,
    
    // New separated pickup data
    availablePickups,
    assignedPickups,
    loadingAvailable,
    loadingAssigned,
    
    // Functions
    updateDriverStatus,
    updatePickupStatus,
    assignDriver,
    unassignDriver,
    selfAssignPickup,
    rejectAssignedPickup,
    calculateOrderPrice,
    updateOrderPricing,
    bulkCalculatePricing,
    refreshData,
    getAvailablePickups,
    selfAssign,
    
    // New functions
    handleSelfAssignment,
    loadAvailablePickups,
    loadAssignedPickups,
    refreshAvailablePickups,
    refreshAssignedPickups,
    refreshAllPickupData
  };
};
