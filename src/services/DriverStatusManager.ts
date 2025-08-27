import { supabase } from '@/integrations/supabase/client';

export class DriverStatusManager {
  
  static async changeDriverStatus(
    driverId: string,
    newStatus: string,
    source: string,
    reason?: string
  ) {
    // Get current status
    const { data: currentDriver } = await supabase
      .from('drivers')
      .select('driver_status')
      .eq('id', driverId)
      .single();

    // Update driver table
    const { error: updateError } = await supabase
      .from('drivers')
      .update({
        driver_status: newStatus,
        last_activity_update: new Date().toISOString()
      })
      .eq('id', driverId);

    // Log to history table
//    if (!updateError) {
 //     await supabase
     //   .from('driver_status_history')
   //     .insert({
       //   driver_id: driverId,
      //    old_status: currentDriver?.driver_status,
      //    new_status: newStatus,
    //      status: newStatus,  // Add this required field
        //  source: source,
      //    reason: reason
    //    });
  //  }
    // Log to history table
if (!updateError) {
  const { error: historyError } = await supabase
    .from('driver_status_history')
    .insert({
      driver_id: driverId,
      old_status: currentDriver?.driver_status,
      new_status: newStatus,
      reason: reason || 'Status changed via DriverStatusManager'
    });
}
    return { error: updateError };
  }

  static async onDriverLogin(driverId: string) {
    return this.changeDriverStatus(driverId, 'available', 'driver_app', 'Driver logged in');
  }

  static async onDriverLogout(driverId: string) {
    return this.changeDriverStatus(driverId, 'offline', 'driver_app', 'Driver logged out');
  }

  static async setDriverBusy(driverId: string, pickupOrderId: string) {
    return this.changeDriverStatus(driverId, 'busy', 'pickup_assignment', `Assigned to pickup ${pickupOrderId}`);
  }

  static async setDriverAvailable(driverId: string, pickupOrderId?: string) {
    const reason = pickupOrderId ? `Completed pickup ${pickupOrderId}` : 'Manual status change';
    return this.changeDriverStatus(driverId, 'available', 'pickup_completion', reason);
  }
}