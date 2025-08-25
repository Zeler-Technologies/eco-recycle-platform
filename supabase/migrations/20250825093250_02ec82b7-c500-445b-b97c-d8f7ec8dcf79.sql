-- Replace assign_driver_to_pickup with the exact required implementation
CREATE OR REPLACE FUNCTION public.assign_driver_to_pickup(
  p_driver_id uuid,
  p_pickup_order_id uuid,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_driver_tenant bigint;
  v_po_tenant bigint;
  v_assignment_id uuid;
BEGIN
  -- Authentication check
  IF v_user IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated'; 
  END IF;

  -- Get tenant IDs for both driver and pickup order
  SELECT tenant_id INTO v_driver_tenant FROM public.drivers WHERE id = p_driver_id;
  SELECT tenant_id INTO v_po_tenant FROM public.pickup_orders WHERE id = p_pickup_order_id;
  
  -- Verify tenant consistency
  IF v_driver_tenant IS NULL OR v_po_tenant IS NULL OR v_driver_tenant <> v_po_tenant THEN
    RAISE EXCEPTION 'Tenant mismatch or missing';
  END IF;

  -- Check for existing active assignments using existing helper function
  IF EXISTS (
    SELECT 1
    FROM public.driver_assignments da
    WHERE da.pickup_order_id = p_pickup_order_id
      AND public._is_assignment_active_text(da.status::text, da.completed_at, da.is_active)
  ) THEN
    RAISE EXCEPTION 'Pickup order already has an active assignment';
  END IF;

  -- Insert assignment record with correct column names
  INSERT INTO public.driver_assignments (
    driver_id, 
    pickup_order_id, 
    status, 
    assigned_at, 
    notes, 
    is_active, 
    role
  )
  VALUES (
    p_driver_id, 
    p_pickup_order_id, 
    'scheduled', 
    now(), 
    p_notes, 
    true, 
    'primary'
  )
  RETURNING id INTO v_assignment_id;

  -- Keep pickup_orders table in sync
  UPDATE public.pickup_orders
     SET driver_id = p_driver_id, updated_at = now()
   WHERE id = p_pickup_order_id;

  -- Return the assignment ID
  RETURN v_assignment_id;
END
$$;

-- Set proper permissions
GRANT EXECUTE ON FUNCTION public.assign_driver_to_pickup(uuid, uuid, text) TO authenticated, service_role;

-- Reload schema so PostgREST picks up changes
NOTIFY pgrst, 'reload schema';