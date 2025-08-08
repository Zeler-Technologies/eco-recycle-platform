import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BillingConfigValue {
  [key: string]: any;
}

interface BillingConfigItem {
  config_category: string;
  config_key: string;
  config_value: any; // Using any since Supabase Json type is too restrictive
  version: number;
  is_global: boolean;
}

interface BillingConfiguration {
  general: {
    currency: string;
    timezone: string;
    locale: string;
    billing_cycle: string;
  };
  payment: {
    tax_rate: number;
    payment_terms_days: number;
    reminder_days: number[];
  };
  email: {
    from_email: string;
    from_name: string;
    template_invoice: string;
    template_reminder: string;
    template_overdue: string;
  };
  shared_costs: {
    [category: string]: {
      percentage: number;
    };
  };
}

interface ConfigVersions {
  [key: string]: number;
}

export function useBillingConfig(tenantId?: number) {
  const [config, setConfig] = useState<Partial<BillingConfiguration>>({});
  const [versions, setVersions] = useState<ConfigVersions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  const buildConfigKey = (category: string, key: string) => `${category}.${key}`;

  const parseConfigData = useCallback((data: BillingConfigItem[]): [Partial<BillingConfiguration>, ConfigVersions] => {
    const parsedConfig: Partial<BillingConfiguration> = {
      general: {} as any,
      payment: {} as any,
      email: {} as any,
      shared_costs: {}
    };
    const configVersions: ConfigVersions = {};

    data.forEach(item => {
      const { config_category, config_key, config_value, version } = item;
      const versionKey = buildConfigKey(config_category, config_key);
      configVersions[versionKey] = version;

      if (config_category === 'general') {
        (parsedConfig.general as any)[config_key] = config_value[config_key];
      } else if (config_category === 'payment') {
        (parsedConfig.payment as any)[config_key] = config_value[config_key];
      } else if (config_category === 'email') {
        if (config_key === 'template_invoice' || config_key === 'template_reminder' || config_key === 'template_overdue') {
          (parsedConfig.email as any)[config_key] = config_value.template_key;
        } else {
          (parsedConfig.email as any)[config_key] = config_value[config_key];
        }
      } else if (config_category === 'shared_costs' && config_key === 'categories') {
        parsedConfig.shared_costs = config_value;
      }
    });

    return [parsedConfig, configVersions];
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_billing_configuration', {
        p_tenant_id: tenantId || null
      });

      if (error) {
        if (error.message?.includes('network') || error.message?.includes('timeout')) {
          throw new Error('Could not connect to the server. Please check your internet connection and try again.');
        }
        throw error;
      }

      const [parsedConfig, configVersions] = parseConfigData(data || []);
      setConfig(parsedConfig);
      setVersions(configVersions);
    } catch (err) {
      let errorMessage = 'Failed to fetch billing configuration';
      
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
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
  }, [tenantId, parseConfigData, toast]);

  const updateConfigValue = useCallback(async (
    category: string,
    key: string,
    value: any
  ): Promise<boolean> => {
    try {
      const versionKey = buildConfigKey(category, key);
      const currentVersion = versions[versionKey];

      let configValue: BillingConfigValue;
      if (category === 'email' && key.startsWith('template_')) {
        configValue = { template_key: value };
      } else {
        configValue = { [key]: value };
      }

      const { data, error } = await supabase.rpc('update_billing_configuration', {
        p_tenant_id: tenantId || null,
        p_config_category: category,
        p_config_key: key,
        p_config_value: configValue,
        p_current_version: currentVersion || null
      });

      if (error) throw error;

      const result = data?.[0];
      if (!result?.success) {
        if (result?.error_message?.includes('modified by another user')) {
          toast({
            title: 'Configuration Conflict',
            description: 'This configuration was modified by another user. Please refresh and try again.',
            variant: 'destructive'
          });
          await fetchConfig(); // Refresh to get latest data
          return false;
        }
        throw new Error(result?.error_message || 'Failed to update configuration');
      }

      // Update local state
      setVersions(prev => ({
        ...prev,
        [versionKey]: result.new_version
      }));

      setConfig(prev => {
        const updated = { ...prev };
        if (category === 'general') {
          updated.general = { ...updated.general, [key]: value };
        } else if (category === 'payment') {
          updated.payment = { ...updated.payment, [key]: value };
        } else if (category === 'email') {
          updated.email = { ...updated.email, [key]: value };
        } else if (category === 'shared_costs' && key === 'categories') {
          updated.shared_costs = value;
        }
        return updated;
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    }
  }, [tenantId, versions, toast, fetchConfig]);

  const updateConfig = useCallback((
    category: keyof BillingConfiguration,
    key: string,
    value: any
  ) => {
    setConfig(prev => {
      const updated = { ...prev };
      if (category === 'shared_costs' && key === 'categories') {
        updated.shared_costs = value;
      } else {
        (updated[category] as any) = { ...updated[category], [key]: value };
      }
      return updated;
    });
    setHasUnsavedChanges(true);
  }, []);

  const saveAllChanges = useCallback(async (): Promise<boolean> => {
    let allSuccess = true;
    
    // Save all changes by comparing with original state
    for (const category of Object.keys(config) as (keyof BillingConfiguration)[]) {
      const categoryConfig = config[category];
      if (!categoryConfig) continue;

      if (category === 'shared_costs') {
        const success = await updateConfigValue(category, 'categories', categoryConfig);
        if (!success) allSuccess = false;
      } else {
        for (const [key, value] of Object.entries(categoryConfig)) {
          const success = await updateConfigValue(category, key, value);
          if (!success) allSuccess = false;
        }
      }
    }

    if (allSuccess) {
      setHasUnsavedChanges(false);
      toast({
        title: 'Success',
        description: 'Billing configuration saved successfully',
      });
    }

    return allSuccess;
  }, [config, updateConfigValue, toast]);

  const resetChanges = useCallback(() => {
    fetchConfig();
    setHasUnsavedChanges(false);
  }, [fetchConfig]);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Real-time subscription for configuration changes
  useEffect(() => {
    const channel = supabase
      .channel('billing-config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'billing_configuration',
          filter: tenantId ? `tenant_id=eq.${tenantId}` : 'tenant_id=is.null'
        },
        () => {
          // Refresh configuration when changes occur
          fetchConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchConfig]);

  return {
    config,
    versions,
    isLoading,
    error,
    hasUnsavedChanges,
    updateConfig,
    saveAllChanges,
    resetChanges,
    refetch: fetchConfig
  };
}