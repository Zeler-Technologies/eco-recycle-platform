import { useState, useEffect, useCallback } from 'react';
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
  car_registration_number: string;
  car_year?: number;
  car_brand: string;
  car_model: string;
  owner_name: string;
  pickup_address: string;
  final_price?: number;
  status: string;
  created_at: string;
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
  driver_notes?: string;
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
  const [pickups, setPickups] = useState<PickupOrder[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Load pickup orders for the driver (including unassigned)
  const loadPickups = useCallback(async (driverId?: string) => {
    if (!driverId) return;

    try {
      // Get assigned pickups for this driver
      const { data: assignedPickups, error: assignedError } = await supabase
        .from('pickup_orders')
        .select(`
          *,
          customer_requests (
            car_registration_number,
            car_brand,
            car_model,
            car_year,
            owner_name,
            pickup_address
          )
        `)
        .eq('assigned_driver_id', driverId)
        .order('created_at', { ascending: false });

      if (assignedError) {
        throw new Error(`Failed to load assigned pickups: ${assignedError.message}`);
      }

      // Get the driver's tenant_id to load unassigned pickups
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('tenant_id')
        .eq('id', driverId)
        .single();

      if (driverError) {
        console.warn('Failed to get driver tenant_id:', driverError.message);
      }

      let unassignedPickups = [];
      
      // Only load unassigned pickups if we have a valid tenant_id
      if (driverData?.tenant_id) {
        const { data: unassignedData, error: unassignedError } = await supabase
          .from('pickup_orders')
          .select(`
            *,
            customer_requests (
              car_registration_number,
              car_brand,
              car_model,
              car_year,
              owner_name,
              pickup_address
            )
          `)
          .is('assigned_driver_id', null)
          .eq('tenant_id', driverData.tenant_id)
          .order('created_at', { ascending: false });

        if (unassignedError) {
          console.warn('Failed to load unassigned pickups:', unassignedError.message);
        } else {
          unassignedPickups = unassignedData || [];
        }
      }

      // Combine both datasets
      const allPickups = [...(assignedPickups || []), ...unassignedPickups];

      // Map the combined result to expected format and fix assigned_driver_id format
      const mappedPickups: PickupOrder[] = allPickups?.map(pickup => {
        // Fix the assigned_driver_id format - handle both direct values and wrapped objects
        let assignedDriverId = pickup.assigned_driver_id;
        if (assignedDriverId && typeof assignedDriverId === 'object' && assignedDriverId.value !== undefined) {
          assignedDriverId = assignedDriverId.value === 'undefined' ? null : assignedDriverId.value;
        }

        return {
          id: pickup.id,
          pickup_id: pickup.id,
          car_registration_number: pickup.customer_requests?.car_registration_number || '',
          car_year: pickup.customer_requests?.car_year,
          car_brand: pickup.customer_requests?.car_brand || '',
          car_model: pickup.customer_requests?.car_model || '',
          owner_name: pickup.customer_requests?.owner_name || '',
          pickup_address: pickup.customer_requests?.pickup_address || '',
          final_price: pickup.final_price,
          status: pickup.status,
          created_at: pickup.created_at,
          vehicle_year: pickup.customer_requests?.car_year,
          vehicle_make: pickup.customer_requests?.car_brand || '',
          vehicle_model: pickup.customer_requests?.car_model || '',
          fuel_type: 'gasoline', // Default value
          pickup_distance: 0, // Default value
          customer_name: pickup.customer_requests?.owner_name || '',
          pickup_location: pickup.customer_requests?.pickup_address || '',
          estimated_arrival: pickup.estimated_arrival,
          scheduled_at: pickup.scheduled_at,
          completion_notes: pickup.completion_photos?.join(', ') || '',
          driver_notes: pickup.driver_notes,
          assigned_driver_id: assignedDriverId // Use the cleaned value
        };
      }) || [];

      setPickups(mappedPickups);

    } catch (err) {
      console.error('Error loading pickups:', err);
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

  // Update pickup status using the working database function
  const updatePickupStatus = useCallback(async (pickupId: string, status: string, notes?: string) => {
    try {
      console.log('Updating pickup status:', { pickupId, status, notes });
      
      // 1. Update the main pickup_orders table (THIS WAS MISSING!)
      const { error: updateError } = await supabase
        .from('pickup_orders')
        .update({
          status,
          driver_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupId);

      if (updateError) {
        console.error('Failed to update pickup_orders:', updateError);
        throw new Error(`Failed to update pickup status: ${updateError.message}`);
      }

      // 2. Update the related customer_requests status to keep tenant views in sync
      const { data: orderRow, error: orderFetchError } = await supabase
        .from('pickup_orders')
        .select('customer_request_id')
        .eq('id', pickupId)
        .maybeSingle();

      if (orderFetchError) {
        console.warn('Failed to fetch pickup_orders row for customer_request sync:', orderFetchError);
      } else if (orderRow?.customer_request_id) {
        const { error: crUpdateError } = await supabase
          .from('customer_requests')
          .update({
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderRow.customer_request_id);
        if (crUpdateError) {
          console.warn('Failed to update customer_requests status:', crUpdateError);
        }
      }

      // 3. Log the change in pickup_status_updates
      const { data, error: logError } = await supabase
        .from('pickup_status_updates')
        .insert({
          pickup_order_id: pickupId,
          new_status: status,
          driver_notes: notes || null,
          changed_by: driver?.driver_id
        })
        .select()
        .single();

      if (logError) {
        console.warn('Failed to log status change:', logError);
        // Don't throw error here since main update succeeded
      }

      console.log('Status update completed successfully');

      // Optimistically update local state immediately
      setPickups(prev => prev.map(pickup => 
        pickup.id === pickupId 
          ? { ...pickup, status, driver_notes: notes }
          : pickup
      ));

      // Also reload pickups to ensure we have the latest data
      if (driver?.driver_id) {
        setTimeout(() => loadPickups(driver.driver_id), 100);
      }

    } catch (err) {
      console.error('Error updating pickup status:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update pickup status');
    }
  }, [driver?.driver_id, loadPickups]);

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
    if (!driver?.id) {
      throw new Error('No driver available');
    }

    try {
      // First get the pickup order to find the customer request ID
      const { data: pickupOrder, error: fetchError } = await supabase
        .from('pickup_orders')
        .select('customer_request_id')
        .eq('id', pickupId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to find pickup order: ${fetchError.message}`);
      }

      // Update the pickup order to unassign driver
      const { error: updateError } = await supabase
        .from('pickup_orders')
        .update({
          assigned_driver_id: null,
          status: 'pending',
          driver_notes: reason || 'Rejected by driver',
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupId)
        .eq('assigned_driver_id', driver.id);

      if (updateError) {
        throw new Error(`Failed to reject pickup: ${updateError.message}`);
      }

      // Also update the customer request status to cancelled
      if (pickupOrder.customer_request_id) {
        const { error: requestError } = await supabase
          .from('customer_requests')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', pickupOrder.customer_request_id);

        if (requestError) {
          console.error('Failed to update customer request status:', requestError);
          // Don't throw error here as the main pickup rejection succeeded
        }
      }

      if (updateError) {
        throw new Error(`Failed to reject pickup: ${updateError.message}`);
      }

      // Deactivate driver assignment
      const { error: assignmentError } = await supabase
        .from('driver_assignments')
        .update({
          is_active: false,
          status: 'canceled',
          completed_at: new Date().toISOString(),
          notes: reason || 'Rejected by driver'
        })
        .eq('pickup_order_id', pickupId)
        .eq('driver_id', driver.id);

      if (assignmentError) {
        console.warn('Failed to update assignment record:', assignmentError.message);
      }

      // Refresh data
      await refreshData();
      return true;

    } catch (err) {
      console.error('Error rejecting pickup:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to reject pickup');
    }
  }, [driver?.id, refreshData]);

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
    }
  }, [driver?.driver_id, loadPickups, loadStatusHistory]);

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

  return {
    pickups,
    driver,
    loading,
    error,
    statusHistory,
    historyLoading,
    isCalculatingPrice,
    pricingError,
    updateDriverStatus,
    updatePickupStatus,
    assignDriver,
    unassignDriver,
    selfAssignPickup,
    rejectAssignedPickup,
    calculateOrderPrice,
    updateOrderPricing,
    bulkCalculatePricing,
    refreshData
  };
};
