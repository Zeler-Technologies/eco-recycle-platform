import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface TenantWithConfig {
  tenant_id: number;
  name: string;
  country: string;
  configurations: any[];
  status: 'complete' | 'partial' | 'missing' | 'conflict';
}

interface ConfigConflict {
  type: 'duplicate' | 'mismatch';
  key: string;
  configs: any[];
  message: string;
}

export const useTenantConfigurations = () => {
  const [tenants, setTenants] = useState<TenantWithConfig[]>([]);
  const [globalConfigs, setGlobalConfigs] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<ConfigConflict[]>([]);
  const [loading, setLoading] = useState(false);

  // Country-based defaults
  const getDefaultsForCountry = useCallback((country: string) => {
    const defaults = {
      'SE': { currency: 'SEK', locale: 'sv', timezone: 'Europe/Stockholm' },
      'NO': { currency: 'NOK', locale: 'no', timezone: 'Europe/Oslo' },
      'DK': { currency: 'DKK', locale: 'da', timezone: 'Europe/Copenhagen' },
      'DE': { currency: 'EUR', locale: 'de', timezone: 'Europe/Berlin' },
      'FI': { currency: 'EUR', locale: 'fi', timezone: 'Europe/Helsinki' },
    };
    return defaults[country] || { currency: 'EUR', locale: 'en', timezone: 'Europe/Stockholm' };
  }, []);

  // Configuration validation
  const validateConfiguration = useCallback((category: string, key: string, value: any) => {
    const validators = {
      general: {
        currency: (v: any) => ['SEK', 'EUR', 'NOK', 'DKK', 'USD'].includes(v.currency),
        locale: (v: any) => ['sv', 'en', 'no', 'da', 'de', 'fi'].includes(v.locale),
        timezone: (v: any) => v.timezone && v.timezone.includes('/'),
        billing_cycle: (v: any) => ['monthly', 'quarterly', 'annual'].includes(v.billing_cycle),
      },
      email: {
        from_email: (v: any) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.from_email),
        from_name: (v: any) => v.from_name && v.from_name.length > 0,
      },
      currency: {
        default: (v: any) => v.code && v.symbol && typeof v.decimal_places === 'number',
      }
    };

    const validator = validators[category]?.[key];
    if (!validator) {
      return { valid: false, error: `Unknown configuration: ${category}/${key}` };
    }

    try {
      const isValid = validator(value);
      return { 
        valid: isValid, 
        error: isValid ? null : `Invalid value for ${category}/${key}` 
      };
    } catch (error) {
      return { valid: false, error: `Validation error: ${error.message}` };
    }
  }, []);

  // Fetch all tenants with their configurations
  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      // Get all tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('tenants_id, name, country')
        .order('name');

      if (tenantsError) throw tenantsError;

      // Get configurations for all tenants
      const tenantsWithConfigs = await Promise.all(
        tenantsData.map(async (tenant) => {
          const { data: configData, error: configError } = await supabase
            .from('billing_configuration')
            .select('*')
            .eq('tenant_id', tenant.tenants_id)
            .eq('is_active', true);

          if (configError) {
            console.error(`Error fetching configs for tenant ${tenant.tenants_id}:`, configError);
          }

          // Determine configuration status
          const configs = configData || [];
          const requiredConfigs = ['general/currency', 'general/locale', 'email/from_email'];
          const existingConfigs = configs.map(c => `${c.config_category}/${c.config_key}`);
          const missingConfigs = requiredConfigs.filter(config => !existingConfigs.includes(config));

          let status: 'complete' | 'partial' | 'missing' | 'conflict' = 'complete';
          if (missingConfigs.length === requiredConfigs.length) {
            status = 'missing';
          } else if (missingConfigs.length > 0) {
            status = 'partial';
          }

          return {
            tenant_id: tenant.tenants_id,
            name: tenant.name,
            country: tenant.country,
            configurations: configs,
            status
          };
        })
      );

      setTenants(tenantsWithConfigs);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch global configurations
  const fetchGlobalConfigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('billing_configuration')
        .select('*')
        .is('tenant_id', null)
        .eq('is_active', true);

      if (error) throw error;
      setGlobalConfigs(data || []);
    } catch (error) {
      console.error('Error fetching global configs:', error);
    }
  }, []);

  // Detect configuration conflicts
  const detectConflicts = useCallback(async () => {
    try {
      const { data: allConfigs, error } = await supabase
        .from('billing_configuration')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const conflicts: ConfigConflict[] = [];
      
      // Group by category and key
      const grouped = (allConfigs || []).reduce((acc, config) => {
        const key = `${config.config_category}/${config.config_key}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(config);
        return acc;
      }, {});

      // Find duplicates within same tenant
      Object.entries(grouped).forEach(([key, configs]: [string, any[]]) => {
        const tenantGroups = configs.reduce((acc, config) => {
          const tenantKey = config.tenant_id || 'global';
          if (!acc[tenantKey]) acc[tenantKey] = [];
          acc[tenantKey].push(config);
          return acc;
        }, {});

        Object.entries(tenantGroups).forEach(([tenantKey, tenantConfigs]: [string, any[]]) => {
          if (tenantConfigs.length > 1) {
            conflicts.push({
              type: 'duplicate',
              key: `${key} (${tenantKey})`,
              configs: tenantConfigs,
              message: `Multiple active values found for ${key} in ${tenantKey}`
            });
          }
        });
      });

      setConflicts(conflicts);
    } catch (error) {
      console.error('Error detecting conflicts:', error);
    }
  }, []);

  // Update tenant configuration
  const updateTenantConfiguration = useCallback(async (
    tenantId: number | null,
    category: string,
    key: string,
    value: any
  ) => {
    try {
      // Validate configuration
      const validation = validateConfiguration(category, key, value);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Deactivate existing configurations for this tenant/category/key
      const { error: deactivateError } = await supabase
        .from('billing_configuration')
        .update({ is_active: false })
        .eq('tenant_id', tenantId)
        .eq('config_category', category)
        .eq('config_key', key)
        .eq('is_active', true);

      if (deactivateError) throw deactivateError;

      // Create new configuration
      const { data, error: insertError } = await supabase
        .from('billing_configuration')
        .insert({
          tenant_id: tenantId,
          config_category: category,
          config_key: key,
          config_value: value,
          is_active: true,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, data };
    } catch (error) {
      console.error('Configuration update error:', error);
      return { success: false, error: error.message };
    }
  }, [validateConfiguration]);

  // Create tenant with default configurations
  const createTenantWithDefaults = useCallback(async (tenantData: any) => {
    try {
      // Create tenant
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenantData.name,
          country: tenantData.country,
          service_type: tenantData.service_type,
          base_address: tenantData.address,
          invoice_email: tenantData.invoice_email,
          date: new Date().toISOString().split('T')[0], // Required date field
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Set country-appropriate defaults
      const defaults = getDefaultsForCountry(tenantData.country);
      const tenantId = newTenant.tenants_id;

      // Create default configurations
      const defaultConfigs = [
        { category: 'general', key: 'currency', value: { currency: defaults.currency } },
        { category: 'general', key: 'locale', value: { locale: defaults.locale } },
        { category: 'general', key: 'timezone', value: { timezone: defaults.timezone } },
        { category: 'general', key: 'billing_cycle', value: { billing_cycle: 'monthly' } },
        { 
          category: 'email', 
          key: 'from_email', 
          value: { 
            from_email: tenantData.invoice_email || `billing@${tenantData.name.toLowerCase().replace(/\s+/g, '')}.com` 
          }
        },
        { 
          category: 'email', 
          key: 'from_name', 
          value: { from_name: `${tenantData.name} Billing` }
        },
      ];

      for (const config of defaultConfigs) {
        await updateTenantConfiguration(tenantId, config.category, config.key, config.value);
      }

      return { success: true, tenant: newTenant };
    } catch (error) {
      console.error('Tenant creation error:', error);
      return { success: false, error: error.message };
    }
  }, [getDefaultsForCountry, updateTenantConfiguration]);

  return {
    tenants,
    globalConfigs,
    conflicts,
    loading,
    fetchTenants,
    fetchGlobalConfigs,
    detectConflicts,
    updateTenantConfiguration,
    createTenantWithDefaults,
    validateConfiguration,
  };
};