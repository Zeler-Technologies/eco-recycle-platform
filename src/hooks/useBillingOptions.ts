import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface Timezone {
  value: string;
  display_name: string;
}

interface Locale {
  code: string;
  name: string;
}

interface EmailTemplate {
  key: string;
  name: string;
  description: string;
  template_type: string;
}

interface BillingOptions {
  currencies: Currency[];
  timezones: Timezone[];
  locales: Locale[];
  email_templates: EmailTemplate[];
}

export function useBillingOptions() {
  const [options, setOptions] = useState<BillingOptions>({
    currencies: [],
    timezones: [],
    locales: [],
    email_templates: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOptions = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_available_options', {}, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (error) {
        if (error.message?.includes('network') || error.message?.includes('timeout')) {
          throw new Error('Could not connect to the server. Please check your internet connection and try again.');
        }
        throw error;
      }

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setOptions(data as unknown as BillingOptions);
      } else {
        setOptions({
          currencies: [],
          timezones: [],
          locales: [],
          email_templates: []
        });
      }
    } catch (err) {
      clearTimeout(timeoutId);
      
      let errorMessage = 'Failed to fetch billing options';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      toast({
        title: 'Connection Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Helper functions to get specific option types
  const getCurrencyOptions = useCallback(() => 
    options.currencies.map(currency => ({
      value: currency.code,
      label: `${currency.name} (${currency.symbol})`
    })), [options.currencies]);

  const getTimezoneOptions = useCallback(() => 
    options.timezones.map(timezone => ({
      value: timezone.value,
      label: timezone.display_name
    })), [options.timezones]);

  const getLocaleOptions = useCallback(() => 
    options.locales.map(locale => ({
      value: locale.code,
      label: locale.name
    })), [options.locales]);

  const getEmailTemplateOptions = useCallback((templateType?: string) => 
    options.email_templates
      .filter(template => !templateType || template.template_type === templateType)
      .map(template => ({
        value: template.key,
        label: template.name,
        description: template.description
      })), [options.email_templates]);

  const getBillingCycleOptions = useCallback(() => [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ], []);

  return {
    options,
    isLoading,
    error,
    refetch: fetchOptions,
    getCurrencyOptions,
    getTimezoneOptions,
    getLocaleOptions,
    getEmailTemplateOptions,
    getBillingCycleOptions
  };
}