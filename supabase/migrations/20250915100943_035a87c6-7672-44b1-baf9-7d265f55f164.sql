-- Drop the broken 9-parameter version
DROP FUNCTION IF EXISTS public.create_tenant_complete(text, text, text, text, text, text, text, text, text);

-- Create the correct 9-parameter version with proper search_path
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
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id BIGINT;
  v_current_user_id UUID;
  v_is_super_admin BOOLEAN := FALSE;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  -- Check super admin (without enum casting)
  IF v_current_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.auth_users 
      WHERE id = v_current_user_id 
      AND role::text = 'super_admin'
    ) INTO v_is_super_admin;
    
    IF NOT v_is_super_admin THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only super admins can create tenants');
    END IF;
  END IF;
  
  -- Check duplicate
  IF EXISTS (SELECT 1 FROM public.tenants WHERE name = p_name) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant already exists');
  END IF;
  
  -- Create tenant
  INSERT INTO public.tenants (name, country, date, service_type, base_address, invoice_email)
  VALUES (p_name, p_country, CURRENT_DATE, p_service_type, p_address, COALESCE(p_invoice_email, p_admin_email))
  RETURNING tenants_id INTO v_tenant_id;
  
  -- Create scrapyard
  INSERT INTO public.scrapyards (name, address, postal_code, city, tenant_id)
  VALUES (p_name, p_address, p_postal_code, p_city, v_tenant_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'admin_name', p_admin_name,
    'admin_email', p_admin_email
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;