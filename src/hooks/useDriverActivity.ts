import { supabase } from '@/integrations/supabase/client';

export const logDriverActivity = async (
  driverId: string,
  tenantId: number,
  activityType: 'pickup_started' | 'pickup_completed' | 'status_change' | 'login' | 'logout',
  details?: {
    pickupOrderId?: string;
    oldStatus?: string;
    newStatus?: string;
    location?: { lat: number; lng: number };
    notes?: string;
  }
) => {
  try {
    // Since driver_activity_log table doesn't exist, log to driver_status_history instead
    await supabase
      .from('driver_status_history')
      .insert({
        driver_id: driverId,
        tenant_id: tenantId,
        new_status: activityType as any,
        old_status: details?.oldStatus as any,
        latitude: details?.location?.lat,
        longitude: details?.location?.lng,
        reason: details?.notes || `${activityType} activity`,
        source: 'system'
      });
  } catch (error) {
    console.error('Failed to log driver activity:', error);
  }
};

export const getDriverActivityHistory = async (driverId: string, days: number = 7) => {
  const { data, error } = await supabase
    .from('driver_status_history')
    .select('*')
    .eq('driver_id', driverId)
    .gte('changed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('changed_at', { ascending: false });

  if (error) throw error;
  return data;
};