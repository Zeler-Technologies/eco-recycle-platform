-- Drop existing functions first
DROP FUNCTION IF EXISTS get_current_driver_info();
DROP FUNCTION IF EXISTS get_driver_pickups(uuid);
DROP FUNCTION IF EXISTS update_pickup_status(uuid, text, text, text[]);
DROP FUNCTION IF EXISTS update_driver_status(text, text);

-- Create function to get current driver info
CREATE OR REPLACE FUNCTION get_current_driver_info()
RETURNS TABLE(
  driver_id uuid,
  tenant_id bigint,
  user_role text,
  full_name text,
  driver_status text,
  phone_number text,
  email text,
  vehicle_registration text,
  vehicle_type text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as driver_id,
    d.tenant_id,
    'driver'::text as user_role,
    d.full_name,
    d.driver_status,
    d.phone_number,
    d.email,
    d.vehicle_registration,
    d.vehicle_type,
    d.is_active
  FROM public.drivers d
  WHERE d.auth_user_id = auth.uid()
  AND d.is_active = true;
END;
$$;

-- Create function to get driver's pickup orders
CREATE OR REPLACE FUNCTION get_driver_pickups(driver_auth_id uuid)
RETURNS TABLE(
  pickup_id uuid,
  customer_request_id uuid,
  car_registration_number text,
  car_brand text,
  car_model text,
  car_year integer,
  owner_name text,
  owner_address text,
  pickup_address text,
  pickup_postal_code text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  status text,
  final_price numeric,
  driver_notes text,
  kontrollsiffror text,
  part_list jsonb,
  created_at timestamp with time zone,
  scheduled_pickup_time timestamp with time zone,
  completion_photos text[],
  pnr_num text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    po.id as pickup_id,
    po.customer_request_id,
    po.car_registration_number,
    po.car_brand,
    po.car_model,
    po.car_year,
    po.owner_name,
    po.owner_address,
    po.pickup_address,
    po.pickup_postal_code,
    po.pickup_latitude,
    po.pickup_longitude,
    po.status,
    po.final_price,
    po.driver_notes,
    po.kontrollsiffror,
    po.part_list,
    po.created_at,
    po.scheduled_pickup_time,
    po.completion_photos,
    po.pnr_num
  FROM public.pickup_orders po
  JOIN public.drivers d ON d.id = po.driver_id
  WHERE d.auth_user_id = driver_auth_id
  AND d.is_active = true
  ORDER BY po.created_at DESC;
END;
$$;

-- Create function to update pickup status
CREATE OR REPLACE FUNCTION update_pickup_status(
  pickup_id uuid,
  new_status text,
  driver_notes_param text DEFAULT NULL,
  completion_photos_param text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  driver_exists boolean;
BEGIN
  -- Check if the current user is the assigned driver for this pickup
  SELECT EXISTS(
    SELECT 1 
    FROM public.pickup_orders po
    JOIN public.drivers d ON d.id = po.driver_id
    WHERE po.id = pickup_id
    AND d.auth_user_id = auth.uid()
  ) INTO driver_exists;
  
  IF NOT driver_exists THEN
    RAISE EXCEPTION 'Unauthorized: Driver not assigned to this pickup order';
  END IF;
  
  -- Update the pickup order
  UPDATE public.pickup_orders
  SET 
    status = new_status,
    driver_notes = COALESCE(driver_notes_param, driver_notes),
    completion_photos = COALESCE(completion_photos_param, completion_photos),
    updated_at = now()
  WHERE id = pickup_id;
  
  RETURN true;
END;
$$;

-- Create function to update driver status
CREATE OR REPLACE FUNCTION update_driver_status(
  new_driver_status text,
  reason_param text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update driver status
  UPDATE public.drivers
  SET 
    driver_status = new_driver_status,
    updated_at = now()
  WHERE auth_user_id = auth.uid()
  AND is_active = true;
  
  RETURN true;
END;
$$;