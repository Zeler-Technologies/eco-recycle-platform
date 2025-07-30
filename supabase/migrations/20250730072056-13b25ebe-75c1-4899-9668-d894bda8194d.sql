-- Fix super admin check in create_tenant_complete function with proper NULL handling
CREATE OR REPLACE FUNCTION public.create_tenant_complete(
    p_name TEXT,
    p_country TEXT,
    p_admin_name TEXT,
    p_admin_email TEXT,
    p_invoice_email TEXT DEFAULT NULL,
    p_service_type TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_postal_code TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_tenant_id BIGINT;
    v_scrapyard_id BIGINT;
    v_generated_password TEXT;
    v_result JSONB;
    v_current_user_id UUID;
    v_is_super_admin BOOLEAN := FALSE;
BEGIN
    -- Get current user ID
    v_current_user_id := auth.uid();
    
    -- Only check super admin if we have an authenticated user
    -- If auth.uid() is NULL, we're in development mode (postgres user) - allow it
    IF v_current_user_id IS NOT NULL THEN
        -- Check both auth_users table and user_roles table for super admin
        BEGIN
            SELECT COALESCE(
                -- Check auth_users table
                (SELECT role::text = 'super_admin' FROM public.auth_users WHERE id = v_current_user_id),
                -- Check user_roles table  
                (SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = v_current_user_id AND role = 'super_admin')),
                -- Default to false if neither check works
                false
            ) INTO v_is_super_admin;
        EXCEPTION WHEN OTHERS THEN
            -- If there's any error in the role check, default to false
            v_is_super_admin := false;
        END;
        
        -- Only require super admin if we have an authenticated user
        IF NOT v_is_super_admin THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Only super admins can create tenants'
            );
        END IF;
    END IF;
    -- If v_current_user_id IS NULL, we skip the check entirely (development mode)

    -- Check for duplicate tenant name
    IF EXISTS (SELECT 1 FROM public.tenants WHERE name = p_name) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tenant with this name already exists'
        );
    END IF;

    -- Generate a random password
    v_generated_password := public.generate_secure_password();

    -- Create the tenant - using correct column names
    INSERT INTO public.tenants (name, country, date, service_type, base_address, invoice_email)
    VALUES (p_name, p_country, CURRENT_DATE, p_service_type, p_address, COALESCE(p_invoice_email, p_admin_email))
    RETURNING id INTO v_tenant_id;  -- Using 'id' instead of 'tenants_id'

    -- Create the scrapyard
    INSERT INTO public.scrapyards (name, address, postal_code, city, tenant_id)
    VALUES (p_name, p_address, p_postal_code, p_city, v_tenant_id)
    RETURNING id INTO v_scrapyard_id;

    -- Return the result
    v_result := jsonb_build_object(
        'success', true,
        'tenant_id', v_tenant_id,
        'scrapyard_id', v_scrapyard_id,
        'admin_name', p_admin_name,
        'admin_email', p_admin_email,
        'invoice_email', COALESCE(p_invoice_email, p_admin_email),
        'generated_password', v_generated_password
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';