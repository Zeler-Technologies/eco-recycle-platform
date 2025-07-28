import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TransportMessageData {
  message: string;
  loading: boolean;
  error: string | null;
}

export const useTransportMessage = (tenantId: number | null, carDetails?: any): TransportMessageData => {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setMessage('Lämna bilen på vår anläggning och få extra ersättning. (Är inkluderat i det pris du får. Gäller endast om bilen är komplett.)');
      setLoading(false);
      return;
    }

    const fetchTransportMessage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the transport message template for this tenant
        const { data: templateData, error: templateError } = await supabase
          .from('custom_message_templates')
          .select('content')
          .eq('tenant_id', tenantId)
          .eq('template_type', 'transport_message')
          .eq('is_active', true)
          .single();

        if (templateError && templateError.code !== 'PGRST116') {
          throw templateError;
        }

        // If no custom template exists, use default message
        let content = templateData?.content || 
          'Lämna bilen på [basadress] och få [bonusbelopp] kr extra. (Är inkluderat i det pris du får. Gäller endast om bilen är komplett.)';

        // Fetch tenant details for base address and bonus
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('base_address')
          .eq('tenants_id', tenantId)
          .single();

        if (tenantError) {
          console.error('Error fetching tenant data:', tenantError);
        }

        // Fetch bonus offers for this tenant
        const { data: bonusData, error: bonusError } = await supabase
          .from('bonus_offers')
          .select('bonus_amount_sek')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (bonusError && bonusError.code !== 'PGRST116') {
          console.error('Error fetching bonus data:', bonusError);
        }

        // Replace template variables
        const processedMessage = content
          .replace(/\[namn\]/g, carDetails?.ownerName || '')
          .replace(/\[registreringsnummer\]/g, carDetails?.registrationNumber || '')
          .replace(/\[kontrollnummer\]/g, carDetails?.controlNumber || '')
          .replace(/\[datum\]/g, new Date().toLocaleDateString('sv-SE'))
          .replace(/\[basadress\]/g, tenantData?.base_address || 'kontakta oss för adress')
          .replace(/\[bonusbelopp\]/g, bonusData?.bonus_amount_sek?.toString() || '500');

        setMessage(processedMessage);
      } catch (err) {
        console.error('Error fetching transport message:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        // Set fallback message
        setMessage('Lämna bilen på vår anläggning och få extra ersättning. Kontakta oss för mer information.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransportMessage();
  }, [tenantId, carDetails]);

  return { message, loading, error };
};