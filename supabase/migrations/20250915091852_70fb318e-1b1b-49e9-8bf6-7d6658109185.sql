-- Fix search_path issue in create_tenant_complete function
CREATE OR REPLACE FUNCTION public.create_tenant_complete(
  tenant_name text,
  tenant_address text DEFAULT NULL::text,
  tenant_phone text DEFAULT NULL::text,
  contact_email text DEFAULT NULL::text,
  billing_address text DEFAULT NULL::text,
  setup_user_email text DEFAULT NULL::text,
  setup_user_phone text DEFAULT NULL::text
)
RETURNS TABLE(success boolean, message text, tenant_id bigint, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'  -- Changed from '' to 'public'
AS $function$
DECLARE
    v_tenant_id BIGINT;
    v_user_id UUID;
    v_current_user_id UUID;
    v_is_super_admin BOOLEAN := FALSE;
BEGIN
    -- Get current user ID
    v_current_user_id := auth.uid();
    
    -- Super admin check - flexible approach
    IF v_current_user_id IS NOT NULL THEN
        -- Try multiple ways to check for super admin
        SELECT COALESCE(
            -- Check auth_users table
            (SELECT role::text = 'super_admin' FROM auth_users WHERE id = v_current_user_id),
            -- Check user_roles table  
            (SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = v_current_user_id AND role = 'super_admin')),
            -- Default to false
            false
        ) INTO v_is_super_admin;
        
        IF NOT v_is_super_admin THEN
            RETURN QUERY SELECT false, 'Only super admins can create tenants', NULL::bigint, NULL::uuid;
            RETURN;
        END IF;
    END IF;

    -- Check for duplicate tenant name
    IF EXISTS (SELECT 1 FROM tenants WHERE name = tenant_name) THEN
        RETURN QUERY SELECT false, 'Tenant with this name already exists', NULL::bigint, NULL::uuid;
        RETURN;
    END IF;

    -- Create tenant
    INSERT INTO tenants (
        name, 
        base_address, 
        invoice_email,
        created_at,
        updated_at
    )
    VALUES (
        tenant_name, 
        tenant_address, 
        contact_email,
        now(),
        now()
    )
    RETURNING tenants_id INTO v_tenant_id;

    -- Return success
    RETURN QUERY SELECT true, 'Tenant created successfully', v_tenant_id, v_user_id;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM, NULL::bigint, NULL::uuid;
END;
$function$;