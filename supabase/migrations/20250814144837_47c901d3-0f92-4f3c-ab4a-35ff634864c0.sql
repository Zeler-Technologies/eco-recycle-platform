-- EMERGENCY FIX: Stop billing table RLS infinite recursion
-- This will immediately fix the super admin logout issue

-- 1. Drop ALL problematic RLS policies on billing tables
DROP POLICY IF EXISTS "Super admins can access all pricing tiers" ON public.pricing_tiers;
DROP POLICY IF EXISTS "Tenant users can access pricing tiers in their tenant" ON public.pricing_tiers;
DROP POLICY IF EXISTS "Super admins can access all margin alert thresholds" ON public.margin_alert_thresholds;
DROP POLICY IF EXISTS "Tenant users can access margin alert thresholds in their tenant" ON public.margin_alert_thresholds;
DROP POLICY IF EXISTS "Super admins can access all billing configuration" ON public.billing_configuration;
DROP POLICY IF EXISTS "Tenant users can access billing configuration in their tenant" ON public.billing_configuration;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.billing_config_audit;
DROP POLICY IF EXISTS "Tenant users can view audit logs for their tenant" ON public.billing_config_audit;

-- 2. Create NEW, simple RLS policies that don't cause recursion using existing safe functions

-- Pricing tiers policies
CREATE POLICY "pricing_tiers_super_admin_access" 
ON public.pricing_tiers 
FOR ALL 
TO authenticated
USING (public.is_super_admin_safe() = true);

CREATE POLICY "pricing_tiers_tenant_access" 
ON public.pricing_tiers 
FOR SELECT 
TO authenticated
USING (
  public.is_super_admin_safe() = false
  AND (
    tenant_id = public.get_user_tenant_id_safe() 
    OR tenant_id IS NULL
  )
);

-- Margin alert thresholds policies
CREATE POLICY "margin_thresholds_super_admin_access" 
ON public.margin_alert_thresholds 
FOR ALL 
TO authenticated
USING (public.is_super_admin_safe() = true);

CREATE POLICY "margin_thresholds_tenant_access" 
ON public.margin_alert_thresholds 
FOR SELECT 
TO authenticated
USING (
  public.is_super_admin_safe() = false
  AND (
    tenant_id = public.get_user_tenant_id_safe() 
    OR tenant_id IS NULL
  )
);

-- Billing configuration policies
CREATE POLICY "billing_config_super_admin_access" 
ON public.billing_configuration 
FOR ALL 
TO authenticated
USING (public.is_super_admin_safe() = true);

CREATE POLICY "billing_config_tenant_access" 
ON public.billing_configuration 
FOR SELECT 
TO authenticated
USING (
  public.is_super_admin_safe() = false
  AND (
    tenant_id = public.get_user_tenant_id_safe() 
    OR tenant_id IS NULL
  )
);

-- Billing audit policies
CREATE POLICY "billing_audit_super_admin_access" 
ON public.billing_config_audit 
FOR SELECT 
TO authenticated
USING (public.is_super_admin_safe() = true);

CREATE POLICY "billing_audit_tenant_access" 
ON public.billing_config_audit 
FOR SELECT 
TO authenticated
USING (
  public.is_super_admin_safe() = false
  AND tenant_id = public.get_user_tenant_id_safe()
);