-- Update list_available_pickup_requests to include tenant filtering
CREATE OR REPLACE FUNCTION list_available_pickup_requests(
  p_driver_id UUID,
  p_tenant_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  pickup_order_id UUID,
  customer_request_id UUID,
  owner_name TEXT,
  pickup_address TEXT,
  car_brand TEXT,
  car_model TEXT,
  status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id as pickup_order_id,
    cr.id as customer_request_id,
    cr.owner_name,
    cr.pickup_address,
    cr.car_brand,
    cr.car_model,
    cr.status
  FROM public.customer_requests cr
  WHERE cr.status IN ('pending', 'approved')
  AND cr.scrapyard_id IS NULL
  AND (p_tenant_id IS NULL OR cr.tenant_id = p_tenant_id) -- CRITICAL: Tenant filtering
  ORDER BY cr.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Update assign_driver_to_pickup to verify tenant ownership
CREATE OR REPLACE FUNCTION assign_driver_to_pickup(
  p_driver_id UUID,
  p_pickup_order_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_driver_tenant_id BIGINT;
  v_request_tenant_id BIGINT;
  result JSON;
BEGIN
  -- Get driver's tenant ID
  SELECT tenant_id INTO v_driver_tenant_id 
  FROM public.drivers 
  WHERE id = p_driver_id AND is_active = true;
  
  -- Get request's tenant ID
  SELECT tenant_id INTO v_request_tenant_id 
  FROM public.customer_requests 
  WHERE id = p_pickup_order_id;
  
  -- CRITICAL: Verify same tenant
  IF v_driver_tenant_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Driver not found or inactive');
  END IF;
  
  IF v_request_tenant_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pickup request not found');
  END IF;
  
  IF v_driver_tenant_id != v_request_tenant_id THEN
    RETURN json_build_object('success', false, 'error', 'Tenant mismatch - driver and request belong to different tenants');
  END IF;
  
  -- Check if request is already assigned
  IF EXISTS (SELECT 1 FROM public.customer_requests WHERE id = p_pickup_order_id AND scrapyard_id IS NOT NULL) THEN
    RETURN json_build_object('success', false, 'error', 'Request already assigned');
  END IF;
  
  -- Assignment logic - find a scrapyard for this tenant
  UPDATE public.customer_requests 
  SET 
    scrapyard_id = (
      SELECT s.id 
      FROM public.scrapyards s 
      WHERE s.tenant_id = v_driver_tenant_id 
      AND s.is_active = true 
      LIMIT 1
    ),
    status = 'assigned',
    pickup_date = CURRENT_DATE + interval '2 hours',
    updated_at = now()
  WHERE id = p_pickup_order_id;

  -- Create driver assignment record
  INSERT INTO public.driver_assignments (
    driver_id,
    customer_request_id,
    status,
    assigned_at,
    notes
  ) VALUES (
    p_driver_id,
    p_pickup_order_id,
    'scheduled',
    now(),
    p_notes
  );

  RETURN json_build_object('success', true, 'message', 'Driver successfully assigned to pickup request');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create function to get drivers by tenant (for enhanced security)
CREATE OR REPLACE FUNCTION get_drivers_by_tenant(
  p_tenant_id BIGINT
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone_number TEXT,
  driver_status driver_status,
  vehicle_type TEXT,
  is_active BOOLEAN,
  tenant_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.full_name,
    d.phone_number,
    d.status as driver_status,
    d.vehicle_type,
    d.is_active,
    d.tenant_id
  FROM public.drivers d
  WHERE d.tenant_id = p_tenant_id
  AND d.is_active = true
  ORDER BY d.full_name;
END;
$$;

-- Create function to get current user info (enhanced)
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(user_role user_role, tenant_id BIGINT, tenant_name TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    u.role, 
    u.tenant_id,
    t.name as tenant_name
  FROM public.auth_users u 
  LEFT JOIN public.tenants t ON u.tenant_id = t.tenants_id
  WHERE u.id = auth.uid();
$$;