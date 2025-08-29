import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { handleStatusTransition } from '@/utils/pickupStatusUtils';
import { useToast } from '@/hooks/use-toast';

interface Driver {
  id: string;
  driver_id: string;
  auth_user_id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  vehicle_type?: string;
  vehicle_registration?: string;
  driver_status?: string;
  current_status?: string;
  status: string;
  current_latitude?: number;
  current_longitude?: number;
  is_active: boolean;
  tenant_id: number;
  scrapyard_id?: number;
  max_capacity_kg?: number;
  last_location_update?: string;
  last_activity_update?: string;
  created_at: string;
  updated_at?: string;
}

interface PickupOrder {
  id: string;
  pickup_id: string;
  pickup_order_id?: string;
  customer_request_id?: string;
  car_registration_number: string;
  car_year?: number;
  car_brand: string;
  car_model: string;
  owner_name: string;
  contact_phone?: string;
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
      const driverData = directDriverData as any;
      const mappedDriver: Driver = {
        ...driverData,
        driver_id: driverData.id,
        status: driverData.status || 'off_duty',
        driver_status: driverData.driver_status || 'offline',
        current_status: driverData.current_status || 'offline',
        auth_user_id: driverData.auth_user_id || '',
        full_name: driverData.full_name || '',
        phone_number: driverData.phone_number || '',
        tenant_id: driverData.tenant_id || 0,
        is_active: driverData.is_active || false,
        created_at: driverData.created_at || ''
      };
      setDriver(mappedDriver);

    } catch (err) {
      console.error('Error loading driver info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load driver information');
    }
  }, [session?.user?.id]);

  // Enhanced self-assignment with proper error handling and UI feedback
  const handleSelfAssignment = useCallback(async (pickupOrderId: string, customerName: string) => {
    if (!driver?.driver_id) {
      throw new Error('Driver ID not available');
    }

    try {
      console.log(`🔄 Driver ${driver.driver_id} attempting self-assignment to pickup ${pickupOrderId}`);
      
      const data = await handleStatusTransition.selfAssign(pickupOrderId);

      console.log('✅ Self-assignment successful:', data);
      
      // Refresh both available and assigned pickups
      await Promise.all([
        loadAvailablePickups(),
        loadAssignedPickups()
      ]);
      
      return true;
    } catch (error) {
      console.error('❌ Self-assignment failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already assigned')) {
          throw new Error('Denna upphämtning har redan tilldelats en annan förare');
        } else if (error.message.includes('not found')) {
          throw new Error('Upphämtningen kunde inte hittas');
        } else {
          throw new Error('Kunde inte tilldela upphämtningen');
        }
      }
      
      throw error;
    }
  }, [driver?.driver_id]);

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

  // Load pickups when driver changes
  useEffect(() => {
    if (driver?.driver_id) {
      loadAvailablePickups();
      loadAssignedPickups();
    }
  }, [driver?.driver_id, loadAvailablePickups, loadAssignedPickups]);

  return {
    // New separated pickup data
    availablePickups,
    assignedPickups,
    loadingAvailable,
    loadingAssigned,
    
    // Driver and basic state
    driver,
    loading,
    error,
    
    // Legacy properties for backward compatibility
    pickups: [...availablePickups, ...assignedPickups],
    statusHistory,
    historyLoading,
    isCalculatingPrice,
    pricingError,
    
    // Functions
    handleSelfAssignment,
    loadAvailablePickups,
    loadAssignedPickups,
    
    // Legacy function stubs for backward compatibility
    updateDriverStatus: async () => console.log('updateDriverStatus not implemented'),
    refreshData: () => Promise.all([loadAvailablePickups(), loadAssignedPickups()]),
    updatePickupStatus: handleStatusTransition,
    refreshAllPickupData: () => Promise.all([loadAvailablePickups(), loadAssignedPickups()])
  };
};