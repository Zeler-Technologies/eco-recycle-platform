-- Create debug function to check current user info
CREATE OR REPLACE FUNCTION public.debug_lovable_user()
RETURNS JSONB AS $$
DECLARE
    v_auth_uid UUID;
    v_auth_user_record RECORD;
    v_user_roles_record RECORD;
    v_result JSONB;
BEGIN
    -- Get current auth.uid()
    v_auth_uid := auth.uid();
    
    -- Get auth_users record if it exists
    SELECT * INTO v_auth_user_record 
    FROM public.auth_users 
    WHERE id = v_auth_uid;
    
    -- Get user_roles record if it exists
    SELECT * INTO v_user_roles_record 
    FROM public.user_roles 
    WHERE user_id = v_auth_uid;
    
    -- Build result
    v_result := jsonb_build_object(
        'auth_uid', v_auth_uid,
        'auth_users_record', CASE 
            WHEN v_auth_user_record.id IS NOT NULL THEN 
                jsonb_build_object(
                    'id', v_auth_user_record.id,
                    'email', v_auth_user_record.email,
                    'role', v_auth_user_record.role,
                    'tenant_id', v_auth_user_record.tenant_id
                )
            ELSE NULL
        END,
        'user_roles_record', CASE 
            WHEN v_user_roles_record.user_id IS NOT NULL THEN 
                jsonb_build_object(
                    'user_id', v_user_roles_record.user_id,
                    'role', v_user_roles_record.role,
                    'scrapyard_id', v_user_roles_record.scrapyard_id
                )
            ELSE NULL
        END,
        'is_super_admin_check', (
            SELECT COALESCE(
                (SELECT role::text = 'super_admin' FROM public.auth_users WHERE id = v_auth_uid),
                (SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = v_auth_uid AND role = 'super_admin')),
                false
            )
        )
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';