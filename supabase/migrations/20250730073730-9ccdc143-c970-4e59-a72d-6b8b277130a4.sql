-- Create debug function for tenant creation testing
CREATE OR REPLACE FUNCTION public.create_tenant_debug(
    p_name TEXT,
    p_country TEXT,
    p_admin_name TEXT,
    p_admin_email TEXT
) RETURNS JSONB AS $$
DECLARE
    v_tenant_id BIGINT;
    v_scrapyard_id BIGINT;
    v_result JSONB;
    v_auth_uid UUID;
    v_user_count INTEGER;
    v_tenant_count INTEGER;
BEGIN
    -- Get debug info
    v_auth_uid := auth.uid();
    
    SELECT COUNT(*) INTO v_user_count FROM public.auth_users;
    SELECT COUNT(*) INTO v_tenant_count FROM public.tenants;
    
    -- Check for duplicate tenant name
    IF EXISTS (SELECT 1 FROM public.tenants WHERE name = p_name) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tenant with this name already exists',
            'debug_info', jsonb_build_object(
                'auth_uid', v_auth_uid,
                'total_users', v_user_count,
                'total_tenants', v_tenant_count,
                'duplicate_name_check', true
            )
        );
    END IF;

    -- Try to create the tenant
    BEGIN
        INSERT INTO public.tenants (name, country, date)
        VALUES (p_name, p_country, CURRENT_DATE)
        RETURNING id INTO v_tenant_id;
        
        -- Try to create the scrapyard
        INSERT INTO public.scrapyards (name, tenant_id)
        VALUES (p_name, v_tenant_id)
        RETURNING id INTO v_scrapyard_id;
        
        -- Return success with debug info
        v_result := jsonb_build_object(
            'success', true,
            'tenant_id', v_tenant_id,
            'scrapyard_id', v_scrapyard_id,
            'debug_info', jsonb_build_object(
                'auth_uid', v_auth_uid,
                'total_users', v_user_count,
                'total_tenants', v_tenant_count + 1,
                'created_at', CURRENT_TIMESTAMP,
                'function_mode', 'debug_no_auth_check'
            )
        );
        
        RETURN v_result;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'debug_info', jsonb_build_object(
                'auth_uid', v_auth_uid,
                'total_users', v_user_count,
                'total_tenants', v_tenant_count,
                'error_context', 'during_insertion'
            )
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';