-- Fix create_tenant_complete function to set the date column
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
)
RETURNS JSONB AS $$
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
  
  -- If we have an authenticated user, check if they're super admin
  IF v_current_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = v_current_user_id AND role = 'super_admin'
    ) INTO v_is_super_admin;
    
    -- Only require super admin if we have an authenticated user
    IF NOT v_is_super_admin THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Only super admins can create tenants'
      );
    END IF;
  END IF;
  
  -- In development mode (no authenticated user), we allow tenant creation
  -- This happens when using mock authentication

  -- Check for duplicate tenant name
  IF EXISTS (SELECT 1 FROM public.tenants WHERE name = p_name) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tenant with this name already exists'
    );
  END IF;

  -- Generate a random password
  v_generated_password := public.generate_secure_password();
  
  -- Create the tenant with date set to current date
  INSERT INTO public.tenants (name, country, date, service_type, base_address, invoice_email)
  VALUES (p_name, p_country, CURRENT_DATE, p_service_type, p_address, p_invoice_email)
  RETURNING tenants_id INTO v_tenant_id;
  
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
    'invoice_email', p_invoice_email,
    'generated_password', v_generated_password
  );
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';