import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for logging events
export type PickupEventType = 'created' | 'assigned' | 'accepted' | 'started' | 'completed' | 'cancelled';
export type VehicleCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'scrap';
export type PaymentMethod = 'bank_transfer' | 'swish' | 'cash';
export type MessageType = 'initial_confirmation' | 'reminder' | 'status_update' | 'completion_notice';

interface PickupEventData {
  pickupOrderId: string;
  eventType: PickupEventType;
  tenantId?: number;
  driverId?: string;
  driverName?: string;
  customerName?: string;
  customerPhone?: string;
  pickupAddress?: string;
  pickupDate?: string;
  pickupTime?: string;
  additionalData?: Record<string, any>;
}

interface PickupCompletionData {
  pickupOrderId: string;
  tenantId: number;
  driverId: string;
  driverName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  registrationNumber: string;
  transportstyrelsendId: string;
  carBrand: string;
  carModel: string;
  carYear?: number;
  pickupAddress: string;
  pickupDate: string;
  pickupTime: string;
  vehicleCondition: VehicleCondition;
  hasCatalyticConverter: boolean;
  hasBattery: boolean;
  weightKg?: number;
  conditionNotes?: string;
  photos?: string[];
  quotedPrice: number;
  finalPrice: number;
  priceAdjustments?: Record<string, number>;
  paymentMethod: PaymentMethod;
}

interface SMSLogData {
  tenantId: number;
  recipientPhone: string;
  recipientName?: string;
  messageType: MessageType;
  messageContent: string;
  pickupOrderId?: string;
  pickupLogId?: number;
  costAmount?: number;
}

export class PickupLoggingService {
  /**
   * Log a pickup event (created, assigned, accepted, started, cancelled)
   */
  static async logPickupEvent(data: PickupEventData): Promise<number | null> {
    try {
      const { data: logEntry, error } = await supabase
        .from('pickup_logs')
        .insert({
          tenant_id: data.tenantId,
          pickup_order_id: data.pickupOrderId,
          event_type: data.eventType,
          event_timestamp: new Date().toISOString(),
          driver_id: data.driverId,
          driver_name: data.driverName,
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          pickup_address: data.pickupAddress,
          pickup_date: data.pickupDate,
          pickup_time: data.pickupTime,
          ...data.additionalData
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error logging pickup event:', error);
        toast.error('Kunde inte logga händelse');
        return null;
      }

      console.log(`Logged ${data.eventType} event for pickup ${data.pickupOrderId}`);
      return logEntry.id;
    } catch (error) {
      console.error('Exception in logPickupEvent:', error);
      return null;
    }
  }

  /**
   * Log pickup completion with all vehicle and payment details
   */
  static async logPickupCompletion(data: PickupCompletionData): Promise<number | null> {
    try {
      const { data: logEntry, error } = await supabase
        .from('pickup_logs')
        .insert({
          tenant_id: data.tenantId,
          pickup_order_id: data.pickupOrderId,
          event_type: 'completed',
          event_timestamp: new Date().toISOString(),
          
          // Driver info
          driver_id: data.driverId,
          driver_name: data.driverName,
          
          // Customer info
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          customer_email: data.customerEmail,
          
          // Vehicle info
          registration_number: data.registrationNumber,
          transportstyrelsen_id: data.transportstyrelsendId,
          car_brand: data.carBrand,
          car_model: data.carModel,
          car_year: data.carYear,
          
          // Pickup info
          pickup_address: data.pickupAddress,
          pickup_date: data.pickupDate,
          pickup_time: data.pickupTime,
          
          // Vehicle assessment
          vehicle_condition: data.vehicleCondition,
          has_catalytic_converter: data.hasCatalyticConverter,
          has_battery: data.hasBattery,
          weight_kg: data.weightKg,
          condition_notes: data.conditionNotes,
          photos: data.photos,
          
          // Financial
          quoted_price: data.quotedPrice,
          final_price: data.finalPrice,
          price_adjustments: data.priceAdjustments,
          payment_method: data.paymentMethod,
          payment_status: 'pending'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error logging pickup completion:', error);
        toast.error('Kunde inte logga slutförd upphämtning');
        return null;
      }

      toast.success('Upphämtning slutförd och loggad!');
      return logEntry.id;
    } catch (error) {
      console.error('Exception in logPickupCompletion:', error);
      return null;
    }
  }

  /**
   * Log an SMS message
   */
  static async logSMS(data: SMSLogData): Promise<boolean> {
    try {
      const costAmount = data.costAmount ?? 0.35; // Default 0.35 SEK per SMS

      const { error } = await supabase
        .from('sms_logs')
        .insert({
          tenant_id: data.tenantId,
          pickup_log_id: data.pickupLogId,
          pickup_order_id: data.pickupOrderId,
          recipient_phone: data.recipientPhone,
          recipient_name: data.recipientName,
          message_type: data.messageType,
          message_content: data.messageContent,
          cost_amount: costAmount,
          currency: 'SEK',
          provider: 'twilio',
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging SMS:', error);
        return false;
      }

      // Update SMS count and cost in pickup_logs if associated with a pickup
      if (data.pickupOrderId) {
        // First, let's get the current values
        const { data: currentLog, error: fetchError } = await supabase
          .from('pickup_logs')
          .select('sms_sent_count, sms_cost_total')
          .eq('pickup_order_id', data.pickupOrderId)
          .eq('event_type', 'completed')
          .single();

        if (!fetchError && currentLog) {
          // Update with new values
          const { error: updateError } = await supabase
            .from('pickup_logs')
            .update({
              sms_sent_count: (currentLog.sms_sent_count || 0) + 1,
              sms_cost_total: (currentLog.sms_cost_total || 0) + costAmount,
              updated_at: new Date().toISOString()
            })
            .eq('pickup_order_id', data.pickupOrderId)
            .eq('event_type', 'completed');

          if (updateError) {
            console.error('Error updating SMS count in pickup_logs:', updateError);
          }
        }
      }

      console.log(`SMS logged: ${data.messageType} to ${data.recipientPhone}`);
      return true;
    } catch (error) {
      console.error('Exception in logSMS:', error);
      return false;
    }
  }

  /**
   * Get pickup logs for a specific tenant with optional filters
   */
  static async getPickupLogs(
    tenantId: number,
    options?: {
      startDate?: string;
      endDate?: string;
      eventType?: PickupEventType;
      driverId?: string;
      limit?: number;
    }
  ) {
    try {
      let query = supabase
        .from('pickup_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('event_timestamp', { ascending: false });

      if (options?.startDate) {
        query = query.gte('event_timestamp', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('event_timestamp', options.endDate);
      }
      if (options?.eventType) {
        query = query.eq('event_type', options.eventType);
      }
      if (options?.driverId) {
        query = query.eq('driver_id', options.driverId);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pickup logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getPickupLogs:', error);
      return [];
    }
  }

  /**
   * Get SMS logs for a specific tenant
   */
  static async getSMSLogs(
    tenantId: number,
    options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ) {
    try {
      let query = supabase
        .from('sms_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sent_at', { ascending: false });

      if (options?.startDate) {
        query = query.gte('sent_at', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('sent_at', options.endDate);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching SMS logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getSMSLogs:', error);
      return [];
    }
  }

  /**
   * Get daily summary for a tenant
   */
  static async getDailySummary(tenantId: number, date: string) {
    try {
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('summary_date', date)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching daily summary:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in getDailySummary:', error);
      return null;
    }
  }

  /**
   * Get summary statistics for a date range
   */
  static async getSummaryStats(
    tenantId: number,
    startDate: string,
    endDate: string
  ) {
    try {
      const { data, error } = await supabase
        .from('daily_summaries')
        .select(`
          summary_date,
          pickups_completed,
          total_revenue,
          sms_sent,
          sms_cost,
          vehicles_excellent,
          vehicles_good,
          vehicles_fair,
          vehicles_poor,
          vehicles_scrap
        `)
        .eq('tenant_id', tenantId)
        .gte('summary_date', startDate)
        .lte('summary_date', endDate)
        .order('summary_date', { ascending: true });

      if (error) {
        console.error('Error fetching summary stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getSummaryStats:', error);
      return [];
    }
  }
}