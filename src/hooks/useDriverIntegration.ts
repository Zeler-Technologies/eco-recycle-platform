import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PickupOrder {
  pickup_id: string;
  customer_request_id: string;
  car_registration_number: string;
  car_brand: string;
  car_model: string;
  car_year?: number;
  owner_name: string;
  owner_address: string;
  pickup_address: string;
  pickup_postal_code: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  status: string;
  final_price?: number;
  driver_notes?: string;
  kontrollsiffror?: string;
  part_list?: any;
  created_at: string;
  scheduled_pickup_time?: string;
  completion_photos?: string[];
  pnr_num?: string;
}

export interface DriverInfo {
  driver_id: string;
  tenant_id: number;
  user_role: string;
}

export const useDriverIntegration = () => {
  const [pickups, setPickups] = useState<PickupOrder[]>([]);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current driver info
  const fetchDriverInfo = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Användaren är inte inloggad');
      }

      const { data, error } = await supabase.rpc('get_current_driver_info');
      
      if (error) {
        throw new Error(`Kunde inte hämta förarinformation: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Ingen förare hittades. Kontakta administratören för att skapa ditt förarkonto.');
      }

      setDriver(data[0]);
      return data[0];
    } catch (err) {
      console.error('Error fetching driver info:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
      return null;
    }
  }, []);

  // Fetch driver's assigned pickup orders
  const fetchDriverPickups = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Användaren är inte inloggad');
      }

      const { data, error } = await supabase.rpc('get_driver_pickups', {
        driver_auth_id: user.id
      });

      if (error) {
        throw new Error(`Kunde inte hämta uppdrag: ${error.message}`);
      }

      setPickups(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching driver pickups:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid hämtning av uppdrag');
      return [];
    }
  }, []);

  // Update pickup order status
  const updatePickupStatus = useCallback(async (
    pickupId: string, 
    status: string, 
    notes?: string, 
    photos?: string[]
  ) => {
    try {
      const { data, error } = await supabase.rpc('update_pickup_status', {
        pickup_id: pickupId,
        new_status: status,
        driver_notes_param: notes || null,
        completion_photos_param: photos || null
      });

      if (error) {
        throw new Error(`Kunde inte uppdatera status: ${error.message}`);
      }

      if (!data) {
        throw new Error('Uppdateringen misslyckades');
      }

      // Refresh pickup orders after successful update
      await fetchDriverPickups();
      return true;
    } catch (err) {
      console.error('Error updating pickup status:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid statusuppdatering');
      return false;
    }
  }, [fetchDriverPickups]);

  // Update driver status
  const updateDriverStatus = useCallback(async (
    newStatus: string, 
    reason?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('update_driver_status', {
        new_driver_status: newStatus,
        reason_param: reason || null
      });

      if (error) {
        throw new Error(`Kunde inte uppdatera förarstatus: ${error.message}`);
      }

      if (!data) {
        throw new Error('Statusuppdateringen misslyckades');
      }

      // Refresh driver info after successful update
      await fetchDriverInfo();
      return true;
    } catch (err) {
      console.error('Error updating driver status:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid statusuppdatering');
      return false;
    }
  }, [fetchDriverInfo]);

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const driverInfo = await fetchDriverInfo();
        if (driverInfo) {
          await fetchDriverPickups();
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [fetchDriverInfo, fetchDriverPickups]);

  // Real-time subscriptions for pickup orders
  useEffect(() => {
    if (!driver) return;

    const channel = supabase
      .channel('pickup_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pickup_orders'
        },
        () => {
          // Refresh pickup orders when changes occur
          fetchDriverPickups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver, fetchDriverPickups]);

  return {
    pickups,
    driver,
    loading,
    error,
    updatePickupStatus,
    updateDriverStatus,
    refetchPickups: fetchDriverPickups,
    refetchDriver: fetchDriverInfo
  };
};