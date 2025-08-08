-- Create lookup tables for billing configuration options
CREATE TABLE IF NOT EXISTS public.supported_currencies (
    code TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supported_timezones (
    value TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supported_locales (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
    key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL,
    locale TEXT DEFAULT 'en',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add version column to billing_configuration for optimistic locking
ALTER TABLE public.billing_configuration 
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Add unique constraint to prevent duplicate configurations
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_config_unique 
ON public.billing_configuration (tenant_id, config_category, config_key);

-- Create trigger to auto-increment version on updates
CREATE OR REPLACE FUNCTION public.increment_billing_config_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_increment_billing_config_version
    BEFORE UPDATE ON public.billing_configuration
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_billing_config_version();

-- Enhanced validation function for billing configuration JSON
CREATE OR REPLACE FUNCTION public.validate_billing_config_json(config_value JSONB, config_category TEXT, config_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Set search path for security
    SET search_path = '';
    
    -- Validate based on category and key
    CASE config_category
        WHEN 'general' THEN
            CASE config_key
                WHEN 'currency' THEN
                    RETURN (config_value ? 'currency') AND 
                           EXISTS(SELECT 1 FROM public.supported_currencies WHERE code = (config_value->>'currency') AND is_active = true);
                WHEN 'timezone' THEN
                    RETURN (config_value ? 'timezone') AND 
                           EXISTS(SELECT 1 FROM public.supported_timezones WHERE value = (config_value->>'timezone') AND is_active = true);
                WHEN 'locale' THEN
                    RETURN (config_value ? 'locale') AND 
                           EXISTS(SELECT 1 FROM public.supported_locales WHERE code = (config_value->>'locale') AND is_active = true);
                WHEN 'billing_cycle' THEN
                    RETURN (config_value->>'billing_cycle') IN ('monthly', 'quarterly', 'yearly');
                ELSE RETURN true;
            END CASE;
        WHEN 'payment' THEN
            CASE config_key
                WHEN 'tax_rate' THEN
                    RETURN (config_value ? 'tax_rate') AND 
                           (config_value->>'tax_rate')::NUMERIC BETWEEN 0 AND 100;
                WHEN 'payment_terms_days' THEN
                    RETURN (config_value ? 'payment_terms_days') AND 
                           (config_value->>'payment_terms_days')::INTEGER BETWEEN 1 AND 90;
                WHEN 'reminder_days' THEN
                    -- Validate array of positive integers
                    RETURN (config_value ? 'reminder_days') AND 
                           jsonb_typeof(config_value->'reminder_days') = 'array' AND
                           (SELECT bool_and((value::TEXT)::INTEGER > 0) 
                            FROM jsonb_array_elements(config_value->'reminder_days'));
                ELSE RETURN true;
            END CASE;
        WHEN 'email' THEN
            CASE config_key
                WHEN 'from_email' THEN
                    RETURN (config_value ? 'from_email') AND 
                           (config_value->>'from_email') ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
                WHEN 'template_invoice', 'template_reminder', 'template_overdue' THEN
                    RETURN (config_value ? 'template_key') AND 
                           EXISTS(SELECT 1 FROM public.email_templates WHERE key = (config_value->>'template_key') AND is_active = true);
                ELSE RETURN true;
            END CASE;
        WHEN 'shared_costs' THEN
            -- Validate shared cost categories structure
            RETURN jsonb_typeof(config_value) = 'object' AND
                   (SELECT bool_and(jsonb_typeof(value) = 'object' AND 
                                   value ? 'percentage' AND 
                                   (value->>'percentage')::NUMERIC BETWEEN 0 AND 100)
                    FROM jsonb_each(config_value));
        ELSE RETURN true;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get billing configuration with global defaults and tenant overrides
CREATE OR REPLACE FUNCTION public.get_billing_configuration(p_tenant_id BIGINT DEFAULT NULL)
RETURNS TABLE(
    config_category TEXT,
    config_key TEXT,
    config_value JSONB,
    version INTEGER,
    is_global BOOLEAN
) AS $$
BEGIN
    SET search_path = '';
    
    RETURN QUERY
    WITH tenant_configs AS (
        SELECT bc.config_category, bc.config_key, bc.config_value, bc.version, false as is_global
        FROM public.billing_configuration bc
        WHERE bc.tenant_id = p_tenant_id AND bc.is_active = true
    ),
    global_configs AS (
        SELECT bc.config_category, bc.config_key, bc.config_value, bc.version, true as is_global
        FROM public.billing_configuration bc
        WHERE bc.tenant_id IS NULL AND bc.is_active = true
    )
    -- Tenant-specific configs take precedence over global defaults
    SELECT COALESCE(tc.config_category, gc.config_category),
           COALESCE(tc.config_key, gc.config_key),
           COALESCE(tc.config_value, gc.config_value),
           COALESCE(tc.version, gc.version),
           COALESCE(tc.is_global, gc.is_global)
    FROM global_configs gc
    FULL OUTER JOIN tenant_configs tc 
        ON gc.config_category = tc.config_category AND gc.config_key = tc.config_key
    WHERE COALESCE(tc.config_value, gc.config_value) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update billing configuration with version checking
CREATE OR REPLACE FUNCTION public.update_billing_configuration(
    p_tenant_id BIGINT,
    p_config_category TEXT,
    p_config_key TEXT,
    p_config_value JSONB,
    p_current_version INTEGER DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    new_version INTEGER,
    error_message TEXT
) AS $$
DECLARE
    v_current_version INTEGER;
    v_new_version INTEGER;
    v_config_id UUID;
BEGIN
    SET search_path = '';
    
    -- Validate the configuration value
    IF NOT public.validate_billing_config_json(p_config_value, p_config_category, p_config_key) THEN
        RETURN QUERY SELECT false, NULL::INTEGER, 'Invalid configuration value'::TEXT;
        RETURN;
    END IF;
    
    -- Check if configuration exists and get current version
    SELECT id, version INTO v_config_id, v_current_version
    FROM public.billing_configuration
    WHERE tenant_id = p_tenant_id 
      AND config_category = p_config_category 
      AND config_key = p_config_key;
    
    -- Version conflict check (if version provided)
    IF p_current_version IS NOT NULL AND v_current_version IS NOT NULL AND v_current_version != p_current_version THEN
        RETURN QUERY SELECT false, v_current_version, 'Configuration has been modified by another user'::TEXT;
        RETURN;
    END IF;
    
    -- Upsert configuration
    INSERT INTO public.billing_configuration (
        tenant_id, config_category, config_key, config_value, created_by
    ) VALUES (
        p_tenant_id, p_config_category, p_config_key, p_config_value, auth.uid()
    )
    ON CONFLICT (tenant_id, config_category, config_key)
    DO UPDATE SET
        config_value = EXCLUDED.config_value,
        updated_by = auth.uid(),
        updated_at = now()
    RETURNING version INTO v_new_version;
    
    RETURN QUERY SELECT true, v_new_version, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get available options for billing configuration
CREATE OR REPLACE FUNCTION public.get_available_options()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SET search_path = '';
    
    SELECT jsonb_build_object(
        'currencies', (
            SELECT jsonb_agg(jsonb_build_object(
                'code', code,
                'symbol', symbol,
                'name', name
            ) ORDER BY name)
            FROM public.supported_currencies
            WHERE is_active = true
        ),
        'timezones', (
            SELECT jsonb_agg(jsonb_build_object(
                'value', value,
                'display_name', display_name
            ) ORDER BY display_name)
            FROM public.supported_timezones
            WHERE is_active = true
        ),
        'locales', (
            SELECT jsonb_agg(jsonb_build_object(
                'code', code,
                'name', name
            ) ORDER BY name)
            FROM public.supported_locales
            WHERE is_active = true
        ),
        'email_templates', (
            SELECT jsonb_agg(jsonb_build_object(
                'key', key,
                'name', name,
                'description', description,
                'template_type', template_type
            ) ORDER BY name)
            FROM public.email_templates
            WHERE is_active = true
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed lookup tables with default data
INSERT INTO public.supported_currencies (code, symbol, name) VALUES
    ('EUR', '€', 'Euro'),
    ('USD', '$', 'US Dollar'),
    ('GBP', '£', 'British Pound'),
    ('SEK', 'kr', 'Swedish Krona'),
    ('NOK', 'kr', 'Norwegian Krone'),
    ('DKK', 'kr', 'Danish Krone')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.supported_timezones (value, display_name) VALUES
    ('Europe/Stockholm', 'Stockholm (CET/CEST)'),
    ('Europe/London', 'London (GMT/BST)'),
    ('America/New_York', 'New York (EST/EDT)'),
    ('America/Los_Angeles', 'Los Angeles (PST/PDT)'),
    ('Europe/Berlin', 'Berlin (CET/CEST)'),
    ('Europe/Paris', 'Paris (CET/CEST)'),
    ('Asia/Tokyo', 'Tokyo (JST)'),
    ('Australia/Sydney', 'Sydney (AEDT/AEST)')
ON CONFLICT (value) DO NOTHING;

INSERT INTO public.supported_locales (code, name) VALUES
    ('en', 'English'),
    ('sv', 'Svenska'),
    ('de', 'Deutsch'),
    ('fr', 'Français'),
    ('es', 'Español'),
    ('it', 'Italiano'),
    ('nl', 'Nederlands'),
    ('da', 'Dansk'),
    ('no', 'Norsk')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.email_templates (key, name, description, template_type) VALUES
    ('invoice_standard', 'Standard Invoice', 'Default invoice template', 'invoice'),
    ('invoice_detailed', 'Detailed Invoice', 'Invoice with itemized breakdown', 'invoice'),
    ('reminder_friendly', 'Friendly Reminder', 'Polite payment reminder', 'reminder'),
    ('reminder_urgent', 'Urgent Reminder', 'More assertive payment reminder', 'reminder'),
    ('overdue_notice', 'Overdue Notice', 'Final notice for overdue payments', 'overdue'),
    ('overdue_legal', 'Legal Notice', 'Legal action warning', 'overdue')
ON CONFLICT (key) DO NOTHING;

-- Seed global default configurations
INSERT INTO public.billing_configuration (tenant_id, config_category, config_key, config_value, created_by) VALUES
    (NULL, 'general', 'currency', '{"currency": "EUR"}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'general', 'timezone', '{"timezone": "Europe/Stockholm"}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'general', 'locale', '{"locale": "en"}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'general', 'billing_cycle', '{"billing_cycle": "monthly"}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'payment', 'tax_rate', '{"tax_rate": 25}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'payment', 'payment_terms_days', '{"payment_terms_days": 30}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'payment', 'reminder_days', '{"reminder_days": [7, 14, 30]}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'email', 'from_email', '{"from_email": "billing@pantabilen.se"}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'email', 'from_name', '{"from_name": "Pantabilen Billing"}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'email', 'template_invoice', '{"template_key": "invoice_standard"}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'email', 'template_reminder', '{"template_key": "reminder_friendly"}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'email', 'template_overdue', '{"template_key": "overdue_notice"}', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'shared_costs', 'categories', '{"administrative": {"percentage": 10}, "operational": {"percentage": 15}, "marketing": {"percentage": 5}}', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tenant_id, config_category, config_key) DO NOTHING;