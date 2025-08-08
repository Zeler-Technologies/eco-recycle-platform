-- Create pricing_tiers table with audit columns and constraints
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id BIGINT REFERENCES public.tenants(tenants_id),
    tier_name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_per_unit NUMERIC(10,2),
    min_units INTEGER DEFAULT 0,
    max_units INTEGER,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_to TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CHECK (max_units IS NULL OR max_units >= min_units),
    UNIQUE(tenant_id, tier_name, effective_from)
);

-- Create margin_alert_thresholds table with audit columns and constraints
CREATE TABLE IF NOT EXISTS public.margin_alert_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id BIGINT REFERENCES public.tenants(tenants_id),
    service_type TEXT NOT NULL,
    alert_category TEXT NOT NULL, -- 'revenue', 'margin', 'utilization'
    threshold_value NUMERIC(10,2) NOT NULL,
    comparison_operator TEXT NOT NULL DEFAULT 'less_than', -- 'less_than', 'greater_than', 'equals'
    severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    message TEXT NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_to TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    CHECK (effective_to IS NULL OR effective_to >= effective_from),
    UNIQUE(tenant_id, service_type, alert_category, effective_from)
);

-- Create billing_configuration table with audit columns and constraints
CREATE TABLE IF NOT EXISTS public.billing_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id BIGINT REFERENCES public.tenants(tenants_id),
    config_category TEXT NOT NULL, -- 'currency', 'tax', 'payment_terms', etc.
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(tenant_id, config_category, config_key)
);

-- Create function to validate billing configuration JSON
CREATE OR REPLACE FUNCTION public.validate_billing_config_json(config_category TEXT, config_value JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    CASE config_category
        WHEN 'currency' THEN
            RETURN config_value ? 'code' AND config_value ? 'symbol';
        WHEN 'tax' THEN
            RETURN config_value ? 'rate' AND (config_value->>'rate')::NUMERIC >= 0;
        WHEN 'payment_terms' THEN
            RETURN config_value ? 'days' AND (config_value->>'days')::INTEGER > 0;
        ELSE
            RETURN TRUE; -- Allow other categories without validation
    END CASE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add validation constraint to billing_configuration
ALTER TABLE public.billing_configuration 
ADD CONSTRAINT billing_config_json_valid 
CHECK (public.validate_billing_config_json(config_category, config_value));

-- Create or update trigger function for updated_at and updated_by
CREATE OR REPLACE FUNCTION public.update_billing_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for all billing tables
CREATE TRIGGER update_pricing_tiers_audit
    BEFORE UPDATE ON public.pricing_tiers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_billing_audit_columns();

CREATE TRIGGER update_margin_alert_thresholds_audit
    BEFORE UPDATE ON public.margin_alert_thresholds
    FOR EACH ROW
    EXECUTE FUNCTION public.update_billing_audit_columns();

CREATE TRIGGER update_billing_configuration_audit
    BEFORE UPDATE ON public.billing_configuration
    FOR EACH ROW
    EXECUTE FUNCTION public.update_billing_audit_columns();

-- Enable RLS on all tables
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margin_alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_configuration ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pricing_tiers
CREATE POLICY "Super admins can access all pricing tiers" 
ON public.pricing_tiers 
FOR ALL 
USING (
    (SELECT get_current_user_info.user_role FROM get_current_user_info()) = 'super_admin'::user_role
);

CREATE POLICY "Tenant users can access pricing tiers in their tenant" 
ON public.pricing_tiers 
FOR SELECT 
USING (
    tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info())
    OR tenant_id IS NULL -- Global tiers
);

-- Create RLS policies for margin_alert_thresholds
CREATE POLICY "Super admins can access all margin alert thresholds" 
ON public.margin_alert_thresholds 
FOR ALL 
USING (
    (SELECT get_current_user_info.user_role FROM get_current_user_info()) = 'super_admin'::user_role
);

CREATE POLICY "Tenant users can access margin alert thresholds in their tenant" 
ON public.margin_alert_thresholds 
FOR SELECT 
USING (
    tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info())
    OR tenant_id IS NULL -- Global thresholds
);

-- Create RLS policies for billing_configuration
CREATE POLICY "Super admins can access all billing configuration" 
ON public.billing_configuration 
FOR ALL 
USING (
    (SELECT get_current_user_info.user_role FROM get_current_user_info()) = 'super_admin'::user_role
);

CREATE POLICY "Tenant users can access billing configuration in their tenant" 
ON public.billing_configuration 
FOR SELECT 
USING (
    tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info())
    OR tenant_id IS NULL -- Global configuration
);

-- Insert default global pricing tiers
INSERT INTO public.pricing_tiers (tenant_id, tier_name, description, base_price, price_per_unit, min_units, max_units, effective_from) VALUES
(NULL, 'Basic', 'Standard pricing for small operations', 50.00, 5.00, 1, 10, now()),
(NULL, 'Professional', 'Enhanced pricing for medium operations', 100.00, 4.50, 11, 50, now()),
(NULL, 'Enterprise', 'Premium pricing for large operations', 200.00, 4.00, 51, NULL, now());

-- Insert default global margin alert thresholds
INSERT INTO public.margin_alert_thresholds (tenant_id, service_type, alert_category, threshold_value, comparison_operator, severity, message, effective_from) VALUES
(NULL, 'pickup', 'margin', 15.00, 'less_than', 'high', 'Pickup service margin below 15%', now()),
(NULL, 'processing', 'margin', 20.00, 'less_than', 'medium', 'Processing service margin below 20%', now()),
(NULL, 'disposal', 'margin', 10.00, 'less_than', 'critical', 'Disposal service margin below 10%', now()),
(NULL, 'pickup', 'revenue', 1000.00, 'less_than', 'medium', 'Monthly pickup revenue below target', now()),
(NULL, 'processing', 'utilization', 75.00, 'less_than', 'low', 'Processing capacity utilization low', now());

-- Insert default global billing configuration
INSERT INTO public.billing_configuration (tenant_id, config_category, config_key, config_value, description) VALUES
(NULL, 'currency', 'default', '{"code": "SEK", "symbol": "kr", "decimal_places": 2}', 'Default currency settings'),
(NULL, 'tax', 'default_rate', '{"rate": 25.0, "description": "Swedish VAT"}', 'Default tax rate'),
(NULL, 'payment_terms', 'default', '{"days": 30, "description": "Net 30 days"}', 'Default payment terms'),
(NULL, 'invoice', 'numbering', '{"prefix": "INV-", "format": "YYYY-NNNN", "start_number": 1000}', 'Invoice numbering configuration');