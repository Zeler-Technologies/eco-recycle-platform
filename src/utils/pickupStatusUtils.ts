import { supabase } from '@/integrations/supabase/client';

/**
 * Standardized function to update pickup status using the unified RPC function
 * Always uses all 4 required parameters to avoid function overloading conflicts
 */
export const updatePickupStatus = async (
  pickupOrderId: string,
  newStatus: string,
  driverNotes?: string,
  completionPhotos?: string[]
) => {
  console.log(`🔄 Updating pickup ${pickupOrderId} status to: ${newStatus}`);
  
  // Update pickup_orders.status directly (single source of truth)
  // The trigger will sync to customer_requests.status automatically
  const { data, error } = await supabase
    .from('pickup_orders')
    .update({ 
      status: newStatus,
      driver_notes: driverNotes || null,
      completion_photos: completionPhotos || null
    })
    .eq('id', pickupOrderId)
    .select();

  if (error) {
    console.error('❌ Error updating pickup status:', error);
    throw error;
  }

  console.log('✅ Pickup status updated successfully:', data);
  return data;
};

/**
 * Helper function to handle common status transitions with default messages
 */
export const handleStatusTransition = {
  /**
   * Assign pickup to a driver
   */
  assignToDriver: (pickupOrderId: string, driverName: string) =>
    updatePickupStatus(
      pickupOrderId,
      'assigned',
      `Assigned to driver: ${driverName}`
    ),

  /**
   * Start pickup process
   */
  startPickup: (pickupOrderId: string, driverName: string) =>
    updatePickupStatus(
      pickupOrderId,
      'in_progress',
      `Pickup started by: ${driverName}`
    ),

  /**
   * Complete pickup with photos
   */
  completePickup: (pickupOrderId: string, driverName: string, photos?: string[]) =>
    updatePickupStatus(
      pickupOrderId,
      'completed',
      `Pickup completed by: ${driverName}`,
      photos
    ),

  /**
   * Cancel pickup
   */
  cancelPickup: (pickupOrderId: string, reason: string = 'Cancelled by admin') =>
    updatePickupStatus(
      pickupOrderId,
      'cancelled',
      reason
    ),

  /**
   * Schedule pickup
   */
  schedulePickup: (pickupOrderId: string, scheduledDateTime: string) =>
    updatePickupStatus(
      pickupOrderId,
      'scheduled',
      `Scheduled for: ${scheduledDateTime}`
    ),

  /**
   * Self-assignment by driver
   */
  selfAssign: (pickupOrderId: string) =>
    updatePickupStatus(
      pickupOrderId,
      'assigned',
      `Self-assigned by driver - ${new Date().toLocaleDateString('sv-SE')}`
    )
};

/**
 * Validate that we have the correct pickup_order_id
 * Many modals confuse customer_request_id with pickup_order_id
 */
export const ensurePickupOrderId = async (customerRequestId: string): Promise<string> => {
  console.log(`🔍 Looking up pickup_order_id for customer_request_id: ${customerRequestId}`);
  
  const { data, error } = await supabase
    .from('pickup_orders')
    .select('id')
    .eq('customer_request_id', customerRequestId)
    .single();

  if (error || !data) {
    throw new Error(`No pickup order found for customer request: ${customerRequestId}`);
  }

  console.log(`✅ Found pickup_order_id: ${data.id}`);
  return data.id;
};