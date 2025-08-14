-- Fix super admin access and tenant creation issues

-- First, create the super admin user in auth_users table
INSERT INTO public.auth_users (id, email, role, tenant_id, created_at) 
VALUES (
  'super-admin-001'::uuid, 
  'admin@pantabilen.se', 
  'super_admin'::user_role, 
  NULL,
  now()
) ON CONFLICT (id) DO UPDATE SET 
  role = 'super_admin'::user_role,
  tenant_id = NULL;

-- Create proper super admin check function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check both auth_users table and mock user ID
    RETURN (
        EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'super_admin'::user_role
        )
        OR auth.uid()::text = 'super-admin-001'
    );
END;
$$;

-- Create simplified tenant creation function
CREATE OR REPLACE FUNCTION public.create_tenant_complete(
    p_name text,
    p_country text,
    p_admin_name text,
    p_admin_email text,
    p_invoice_email text DEFAULT NULL,
    p_service_type text DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_postal_code text DEFAULT NULL,
    p_city text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id BIGINT;
    v_scrapyard_id BIGINT;
    v_result JSONB;
BEGIN
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only super admins can create tenants'
        );
    END IF;

    -- Check for duplicate tenant name
    IF EXISTS (SELECT 1 FROM public.tenants WHERE name = p_name) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tenant with this name already exists'
        );
    END IF;

    -- Create tenant
    INSERT INTO public.tenants (
        name, 
        country, 
        date, 
        service_type, 
        base_address, 
        invoice_email
    )
    VALUES (
        p_name, 
        p_country, 
        CURRENT_DATE, 
        COALESCE(p_service_type, 'car_recycling'), 
        p_address, 
        COALESCE(p_invoice_email, p_admin_email)
    )
    RETURNING tenants_id INTO v_tenant_id;

    -- Create scrapyard
    INSERT INTO public.scrapyards (
        name, 
        address, 
        postal_code, 
        city, 
        tenant_id,
        is_active
    )
    VALUES (
        p_name, 
        p_address, 
        p_postal_code, 
        p_city, 
        v_tenant_id,
        true
    )
    RETURNING id INTO v_scrapyard_id;

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', v_tenant_id,
        'scrapyard_id', v_scrapyard_id,
        'admin_name', p_admin_name,
        'admin_email', p_admin_email,
        'invoice_email', COALESCE(p_invoice_email, p_admin_email)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE
    );
END;
$$;

-- Drop conflicting policies and create simple super admin policies
DROP POLICY IF EXISTS "Super admins can access all tenants" ON tenants;
DROP POLICY IF EXISTS "Super admins can access all drivers" ON drivers;
DROP POLICY IF EXISTS "allow_super_admin_bypass_tenants" ON tenants;
DROP POLICY IF EXISTS "allow_super_admin_bypass_drivers" ON drivers;

-- Create simple policies for super admin access
CREATE POLICY "super_admin_all_access_tenants" ON tenants
    FOR ALL 
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_all_access_drivers" ON drivers
    FOR ALL 
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Ensure RLS is enabled
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;