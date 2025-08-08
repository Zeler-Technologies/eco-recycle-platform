-- Add composite index for better query performance on billing_configuration
CREATE INDEX IF NOT EXISTS idx_billing_config_tenant_category ON public.billing_configuration(tenant_id, config_category);

-- Add audit table for billing configuration changes
CREATE TABLE IF NOT EXISTS public.billing_config_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id BIGINT,
    config_category TEXT NOT NULL,
    config_key TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Add RLS policies for audit table
ALTER TABLE public.billing_config_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all audit logs" ON public.billing_config_audit
    FOR SELECT USING (
        (SELECT user_role FROM get_current_user_info()) = 'super_admin'
    );

CREATE POLICY "Tenant users can view audit logs for their tenant" ON public.billing_config_audit
    FOR SELECT USING (
        tenant_id = (SELECT tenant_id FROM get_current_user_info())
    );

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.billing_config_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.billing_config_audit (
            tenant_id, config_category, config_key, 
            old_value, new_value, changed_by, action
        ) VALUES (
            NEW.tenant_id, NEW.config_category, NEW.config_key,
            NULL, NEW.config_value, NEW.updated_by, 'INSERT'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.billing_config_audit (
            tenant_id, config_category, config_key,
            old_value, new_value, changed_by, action
        ) VALUES (
            NEW.tenant_id, NEW.config_category, NEW.config_key,
            OLD.config_value, NEW.config_value, NEW.updated_by, 'UPDATE'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.billing_config_audit (
            tenant_id, config_category, config_key,
            old_value, new_value, changed_by, action
        ) VALUES (
            OLD.tenant_id, OLD.config_category, OLD.config_key,
            OLD.config_value, NULL, auth.uid(), 'DELETE'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create the audit trigger
DROP TRIGGER IF EXISTS billing_config_audit_trigger ON public.billing_configuration;
CREATE TRIGGER billing_config_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.billing_configuration
    FOR EACH ROW EXECUTE FUNCTION public.billing_config_audit_trigger();