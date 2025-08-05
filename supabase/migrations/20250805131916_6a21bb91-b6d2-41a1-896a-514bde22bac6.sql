-- PHASE 1: Create essential database functions for driver app integration

-- Function to get current driver info from auth user
CREATE OR REPLACE FUNCTION public.get_current_driver_info()
RETURNS TABLE (
  driver_id UUID,
  tenant_id BIGINT,
  user_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.tenant_id,
    'driver'::TEXT
  FROM public.drivers d
  WHERE d.auth_user_id = auth.uid()
  AND d.is_active = true;
END;
$$;

-- Function to get driver's assigned pickup orders with full details
CREATE OR REPLACE FUNCTION public.get_driver_pickups(driver_auth_id UUID)
RETURNS TABLE (
  pickup_id UUID,
  customer_request_id UUID,
  car_registration_number TEXT,
  car_brand TEXT,
  car_model TEXT,
  car_year INTEGER,
  owner_name TEXT,
  owner_address TEXT,
  pickup_address TEXT,
  pickup_postal_code TEXT,
  pickup_latitude NUMERIC,
  pickup_longitude NUMERIC,
  status TEXT,
  final_price NUMERIC,
  driver_notes TEXT,
  kontrollsiffror TEXT,
  part_list JSONB,
  created_at TIMESTAMPTZ,
  scheduled_pickup_time TIMESTAMPTZ,
  completion_photos TEXT[],
  pnr_num TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    po.id as pickup_id,
    cr.id as customer_request_id,
    cr.car_registration_number,
    cr.car_brand,
    cr.car_model,
    cr.car_year,
    cr.owner_name,
    cr.owner_address,
    cr.pickup_address,
    cr.pickup_postal_code,
    cr.pickup_latitude,
    cr.pickup_longitude,
    po.status,
    po.final_price,
    po.driver_notes,
    cm.kontrollsiffror,
    cm.part_list,
    po.created_at,
    po.scheduled_pickup_time,
    po.completion_photos,
    cr.pnr_num
  FROM public.pickup_orders po
  JOIN public.driver_assignments da ON po.id = da.pickup_order_id
  JOIN public.drivers d ON da.driver_id = d.id
  JOIN public.customer_requests cr ON po.customer_request_id = cr.id
  LEFT JOIN public.car_metadata cm ON cr.id = cm.customer_request_id
  WHERE d.auth_user_id = driver_auth_id
  AND da.is_active = true
  AND d.is_active = true
  ORDER BY po.created_at DESC;
END;
$$;

-- Function to update pickup status with audit trail
CREATE OR REPLACE FUNCTION public.update_pickup_status(
  pickup_id UUID,
  new_status TEXT,
  driver_notes_param TEXT DEFAULT NULL,
  completion_photos_param TEXT[] DEFAULT NULL,
  driver_auth_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  old_status TEXT;
  driver_id_val UUID;
BEGIN
  -- Get current status and driver ID
  SELECT po.status, d.id INTO old_status, driver_id_val
  FROM public.pickup_orders po
  JOIN public.driver_assignments da ON po.id = da.pickup_order_id  
  JOIN public.drivers d ON da.driver_id = d.id
  WHERE po.id = pickup_id AND d.auth_user_id = driver_auth_id;
  
  IF driver_id_val IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update pickup order
  UPDATE public.pickup_orders 
  SET 
    status = new_status,
    driver_notes = COALESCE(driver_notes_param, driver_notes),
    completion_photos = COALESCE(completion_photos_param, completion_photos),
    updated_at = NOW(),
    completed_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE completed_at END
  WHERE id = pickup_id;
  
  -- Log status update in pickup_status_updates table
  INSERT INTO public.pickup_status_updates (
    pickup_order_id,
    driver_id,
    old_status,
    new_status,
    notes,
    photos,
    timestamp
  ) VALUES (
    pickup_id,
    driver_id_val, 
    old_status,
    new_status,
    driver_notes_param,
    completion_photos_param,
    NOW()
  );
  
  RETURN TRUE;
END;
$$;

-- Function to update driver status with history logging
CREATE OR REPLACE FUNCTION public.update_driver_status(
  new_driver_status TEXT,
  reason_param TEXT DEFAULT NULL,
  driver_auth_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  old_status TEXT;
  driver_id_val UUID;
BEGIN
  -- Get current status and driver ID
  SELECT d.driver_status, d.id INTO old_status, driver_id_val
  FROM public.drivers d
  WHERE d.auth_user_id = driver_auth_id AND d.is_active = true;
  
  IF driver_id_val IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update driver status
  UPDATE public.drivers 
  SET 
    driver_status = new_driver_status,
    updated_at = NOW()
  WHERE auth_user_id = driver_auth_id;
  
  -- Log status change in driver_status_history
  INSERT INTO public.driver_status_history (
    driver_id,
    old_status,
    new_status,
    reason,
    changed_at,
    changed_by
  ) VALUES (
    driver_id_val,
    old_status,
    new_driver_status,
    reason_param,
    NOW(),
    driver_auth_id
  );
  
  RETURN TRUE;
END;
$$;