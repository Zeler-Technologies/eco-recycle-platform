import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeDriverStatus } from '@/utils/driverStatus';
import { toast } from '@/hooks/use-toast';
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
  // New fields aligned with DB helper/migration
  scheduled_at?: string | null;
  assigned_driver_id?: string | null;
}

export interface DriverInfo {
  driver_id: string;
  tenant_id: number;
  user_role: string;
  full_name?: string;
  driver_status?: string;
}

export interface DriverStatusHistoryEntry {
  id: string;
  changed_at: string;
  old_status: string | null;
  new_status: string;
  reason?: string | null;
  source?: string | null;
}
export const useDriverIntegration = () => {
  const [pickups, setPickups] = useState<PickupOrder[]>([]);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<DriverStatusHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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

      const base = data[0];

      // Try enriched driver row by auth_user_id first, then fallback to id from RPC
      let driverRow: { id: string; tenant_id: number; full_name?: string; driver_status?: string } | null = null;

      const { data: byAuth } = await supabase
        .from('drivers')
        .select('id, tenant_id, full_name, driver_status')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (byAuth) driverRow = byAuth as any;

      if (!driverRow) {
        const { data: byId } = await supabase
          .from('drivers')
          .select('id, tenant_id, full_name, driver_status')
          .eq('id', base.driver_id)
          .maybeSingle();
        if (byId) driverRow = byId as any;
      }

      const merged: DriverInfo = {
        driver_id: base.driver_id,
        tenant_id: base.tenant_id,
        user_role: base.user_role,
        full_name: driverRow?.full_name,
        driver_status: normalizeDriverStatus(driverRow?.driver_status),
      };

      setDriver(merged);
      return merged;
    } catch (err) {
      console.error('❌ Error fetching driver info:', err);
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

  // Fetch recent driver status history (last 10)
  const fetchDriverStatusHistory = useCallback(async (driverId?: string) => {
    const id = driverId || driver?.driver_id;
    if (!id) return [] as DriverStatusHistoryEntry[];
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('driver_status_history')
        .select('id, changed_at, old_status, new_status, reason, source')
        .eq('driver_id', id)
        .order('changed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const rows = (data as any) || [];
      setStatusHistory(rows);
      return rows as DriverStatusHistoryEntry[];
    } catch (err) {
      console.error('Error fetching driver status history:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid hämtning av statusändringar');
      return [] as DriverStatusHistoryEntry[];
    } finally {
      setHistoryLoading(false);
    }
  }, [driver?.driver_id]);
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

  // Update driver status with optimistic UI and server RPC
  const updateDriverStatus = useCallback(async (
    newStatus: string,
    reason?: string
  ) => {
    const prev = driver;
    // Optimistic update
    if (prev) {
      setDriver({ ...prev, driver_status: normalizeDriverStatus(newStatus) });
    }

    try {
      const { error } = await supabase.rpc('update_driver_status', {
        new_driver_status: newStatus,
        reason_param: reason || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Server will broadcast realtime; ensure local info stays consistent
      const refreshed = await fetchDriverInfo();
      // Also refresh recent history panel
      await fetchDriverStatusHistory(refreshed?.driver_id);
      return true;
    } catch (err) {
      console.error('Error updating driver status:', err);
      // Rollback optimistic state
      if (prev) setDriver(prev);
      const msg = err instanceof Error ? err.message : 'Ett fel uppstod vid statusuppdatering';
      setError(msg);
      toast({ title: 'Kunde inte uppdatera förarstatus', description: msg, variant: 'destructive' });
      return false;
    }
  }, [driver, fetchDriverInfo, fetchDriverStatusHistory]);

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      try {
        const driverInfo = await fetchDriverInfo();
        if (driverInfo) {
          await Promise.all([
            fetchDriverPickups(),
            fetchDriverStatusHistory(driverInfo.driver_id),
          ]);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [fetchDriverInfo, fetchDriverPickups, fetchDriverStatusHistory]);

  // Real-time subscriptions for pickup orders - narrowed to this driver via assigned_driver_id
  useEffect(() => {
    if (!driver?.driver_id) return;

    const channel = supabase
      .channel(`pickup_orders_changes_${driver.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pickup_orders',
          filter: `assigned_driver_id=eq.${driver.driver_id}`,
        },
        () => {
          console.log('[RT] pickup_orders change for current driver -> refetch');
          fetchDriverPickups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver?.driver_id, fetchDriverPickups]);

  // Real-time subscription for driver status changes
  useEffect(() => {
    if (!driver?.driver_id) return;

    const channel = supabase
      .channel('driver_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${driver.driver_id}`,
        },
        () => {
          // Refresh driver info when own driver row changes
          fetchDriverInfo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver?.driver_id, fetchDriverInfo]);

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
