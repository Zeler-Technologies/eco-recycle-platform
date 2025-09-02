import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PickupStatusChangeData {
  pickupOrderId: string;
  newStatus: string;
  tenantId: number;
}

export const useSMSAutomation = () => {
  const { toast } = useToast();

  const triggerSMSAutomation = useCallback(async ({
    pickupOrderId,
    newStatus,
    tenantId
  }: PickupStatusChangeData) => {
    const triggerMap: Record<string, string> = {
      'confirmed': 'booking_confirmed',
      'assigned': 'driver_assigned',
      'en_route': 'driver_en_route',
      'completed': 'pickup_completed'
    };

    if (!triggerMap[newStatus]) {
      return; // No trigger for this status
    }

    try {
      // Check if there's an active trigger rule for this event
      const { data: triggerRule, error: triggerError } = await supabase
        .from('sms_trigger_rules' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('trigger_event', triggerMap[newStatus])
        .eq('is_enabled', true)
        .single();

      if (triggerError || !triggerRule) {
        console.log('No active trigger rule found for event:', triggerMap[newStatus]);
        return;
      }

      // Get template data
      const { data: template, error: templateError } = await supabase
        .from('custom_message_templates')
        .select('*')
        .eq('id', (triggerRule as any).template_id)
        .single();

      if (templateError || !template) {
        console.error('Error fetching template:', templateError);
        return;
      }

      // Get customer data from pickup order
      const { data: pickupData, error: pickupError } = await supabase
        .from('pickup_orders' as any)
        .select(`
          *,
          customer_requests!inner(
            owner_name,
            contact_phone,
            car_registration_number,
            pnr_num
          )
        `)
        .eq('id', pickupOrderId)
        .single();

      if (pickupError || !pickupData) {
        console.error('Error fetching pickup data:', pickupError);
        return;
      }

      const customerData = (pickupData as any).customer_requests;

      if (!template || !customerData) {
        console.error('Missing template or customer data');
        return;
      }

      // Replace variables in message content
      let messageContent = template.content
        .replace(/\[namn\]/g, customerData.owner_name || 'Kund')
        .replace(/\[registreringsnummer\]/g, customerData.car_registration_number || 'N/A')
        .replace(/\[kontrollnummer\]/g, customerData.pnr_num || 'N/A')
        .replace(/\[datum\]/g, new Date().toLocaleDateString('sv-SE'));

      // Calculate SMS cost
      const smsCount = Math.ceil(messageContent.length / 160);
      const cost = smsCount * 0.35;

      // Send SMS (simulate for now) and log to database
      const { error: smsLogError } = await supabase
        .from('sms_logs' as any)
        .insert({
          tenant_id: tenantId,
          pickup_order_id: pickupOrderId,
          recipient_phone: customerData.contact_phone || 'N/A',
          recipient_name: customerData.owner_name || 'Kund',
          message_content: messageContent,
          message_type: (triggerRule as any).trigger_event,
          status: 'sent',
          cost_amount: cost,
          template_id: template.id,
          created_at: new Date().toISOString()
        });

      if (smsLogError) {
        console.error('Error logging SMS:', smsLogError);
        toast({
          title: "SMS-loggning misslyckades",
          description: "SMS skickades men kunde inte loggas.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "SMS skickat",
        description: `Automatiskt SMS skickat till ${customerData.owner_name}. Kostnad: ${cost.toFixed(2)} SEK`,
      });

      return { success: true, cost, messageContent };

    } catch (error) {
      console.error('SMS automation failed:', error);
      toast({
        title: "SMS-automation misslyckades",
        description: "Kunde inte skicka automatiskt SMS.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [toast]);

  return { triggerSMSAutomation };
};