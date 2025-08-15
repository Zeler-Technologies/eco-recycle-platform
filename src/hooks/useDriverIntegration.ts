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

  // Load pickup orders for the driver
  const loadPickups = useCallback(async (driverId?: string) => {
    if (!driverId) return;

    try {
      // Use direct query to pickup_orders table
      const { data: directPickupData, error: directError } = await supabase
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

      if (directError) {
        throw new Error(`Failed to load pickups: ${directError.message}`);
      }

      // Map the direct query result to expected format
      const mappedPickups: PickupOrder[] = directPickupData?.map(pickup => ({
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
        completion_notes: pickup.completion_photos?.join(', ') || '', // Fix: use completion_photos
        driver_notes: pickup.driver_notes
      })) || [];

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

  // Update pickup status
  const updatePickupStatus = useCallback(async (pickupId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('pickup_orders')
        .update({ 
          status,
          driver_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupId);

      if (error) {
        throw new Error(`Failed to update pickup status: ${error.message}`);
      }

      // Optimistically update local state
      setPickups(prev => prev.map(pickup => 
        pickup.id === pickupId 
          ? { ...pickup, status, driver_notes: notes }
          : pickup
      ));

    } catch (err) {
      console.error('Error updating pickup status:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update pickup status');
    }
  }, []);

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
    calculateOrderPrice,
    updateOrderPricing,
    bulkCalculatePricing,
    refreshData
  };
};
