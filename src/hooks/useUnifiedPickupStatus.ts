import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UnifiedPickupData {
  pickup_order_id: string;
  customer_request_id: string;
  current_status: string;
  scheduled_pickup_date?: string;
  actual_pickup_date?: string;
  assigned_driver_id?: string;
  driver_name?: string;
  driver_notes?: string;
  completion_photos?: string[];
  final_price?: number;
  tenant_id: number;
  owner_name?: string;
  contact_phone?: string;
  pickup_address?: string;
  car_brand?: string;
  car_model?: string;
  car_year?: number;
  car_registration_number?: string;
  estimated_value?: number;
  quote_amount?: number;
  scrapyard_id?: number;
}

export const useUnifiedPickupStatus = () => {
  const [pickups, setPickups] = useState<UnifiedPickupData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPickups = async () => {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_unified_pickup_status')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('pickup_created_at', { ascending: false });

      if (error) {
        console.error('Error fetching unified pickup data:', error);
        return;
      }

      setPickups(data || []);
    } catch (error) {
      console.error('Error in fetchPickups:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePickupStatus = async (pickupOrderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pickup_orders')
        .update({ status: newStatus })
        .eq('id', pickupOrderId);

      if (error) {
        console.error('Error updating pickup status:', error);
        throw error;
      }

      // Refresh data after update
      await fetchPickups();
    } catch (error) {
      console.error('Error in updatePickupStatus:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPickups();
  }, [user?.tenant_id]);

  // Set up real-time subscription for status changes
  useEffect(() => {
    if (!user?.tenant_id) return;

    const channel = supabase.channel('unified-pickup-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pickup_orders',
        filter: `tenant_id=eq.${user.tenant_id}`
      }, () => {
        fetchPickups();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customer_requests',
        filter: `tenant_id=eq.${user.tenant_id}`
      }, () => {
        fetchPickups();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.tenant_id]);

  return {
    pickups,
    loading,
    fetchPickups,
    updatePickupStatus
  };
};