-- Pickup-First Assignment System: corrected SQL functions
-- FUNCTION 1: Get unassigned pickup orders for tenant
CREATE OR REPLACE FUNCTION public.get_unassigned_pickup_orders(
  p_tenant_id bigint,
  p_limit int DEFAULT 50
) RETURNS TABLE (
  pickup_order_id uuid,
  customer_request_id uuid,
  owner_name text,
  car_registration_number text,
  car_brand text,
  car_model text,
  car_year int,
  pickup_address text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  scheduled_pickup_date date,
  status text,
  final_price numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_user_tenant bigint;
  v_user_role text;
BEGIN
  -- SECURITY CHECK
  IF v_user IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated'; 
  END IF;

  -- CHECK PERMISSIONS
  SELECT au.tenant_id, au.role::text 
  INTO v_user_tenant, v_user_role
  FROM public.auth_users au 
  WHERE au.id = v_user;

  IF v_user_role = 'super_admin' THEN
    NULL; -- Super admin can see any tenant
  ELSIF v_user_role = 'tenant_admin' AND v_user_tenant = p_tenant_id THEN
    NULL; -- Tenant admin can only see their own tenant
  ELSE
    RAISE EXCEPTION 'Insufficient permissions to view pickup orders for this tenant';
  END IF;

  -- RETURN UNASSIGNED ORDERS
  RETURN QUERY
  WITH unassigned_orders AS (
    SELECT po.*
    FROM public.pickup_orders po
    WHERE po.tenant_id = p_tenant_id
      AND COALESCE(po.status, 'scheduled') IN ('scheduled', 'pending')
      AND po.driver_id IS NULL
      -- CRITICAL: Use existing helper function
      AND NOT EXISTS (
        SELECT 1
        FROM public.driver_assignments da
        WHERE da.pickup_order_id = po.id
          AND public._is_assignment_active_text(da.status::text, da.completed_at, da.is_active)
      )
  )
  SELECT
    po.id AS pickup_order_id,
    po.customer_request_id,
    cr.owner_name,
    cr.car_registration_number,
    cr.car_brand,
    cr.car_model,
    cr.car_year,
    cr.pickup_address,
    cr.pickup_latitude,
    cr.pickup_longitude,
    po.scheduled_pickup_date,
    po.status,
    po.final_price,
    po.created_at
  FROM unassigned_orders po
  LEFT JOIN public.customer_requests cr ON cr.id = po.customer_request_id
  ORDER BY COALESCE(po.scheduled_pickup_date, CURRENT_DATE) ASC, po.created_at ASC
  LIMIT p_limit;
END
$$;

-- FUNCTION 2: Get available drivers for tenant
CREATE OR REPLACE FUNCTION public.get_available_drivers_for_tenant(
  p_tenant_id bigint
) RETURNS TABLE (
  driver_id uuid,
  full_name text,
  phone_number text,
  email text,
  driver_status text,
  vehicle_type text,
  is_active boolean,
  current_assignments_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_user_tenant bigint;
  v_user_role text;
BEGIN
  -- SECURITY CHECK
  IF v_user IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated'; 
  END IF;

  -- CHECK PERMISSIONS
  SELECT au.tenant_id, au.role::text 
  INTO v_user_tenant, v_user_role
  FROM public.auth_users au 
  WHERE au.id = v_user;

  IF v_user_role = 'super_admin' THEN
    NULL;
  ELSIF v_user_role = 'tenant_admin' AND v_user_tenant = p_tenant_id THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'Insufficient permissions to view drivers for this tenant';
  END IF;

  -- RETURN AVAILABLE DRIVERS
  RETURN QUERY
  SELECT
    d.id AS driver_id,
    d.full_name,
    d.phone_number,
    d.email,
    d.driver_status::text,
    d.vehicle_type,
    d.is_active,
    COALESCE(active_assignments.assignment_count, 0) as current_assignments_count
  FROM public.drivers d
  LEFT JOIN (
    SELECT 
      da.driver_id,
      COUNT(*) as assignment_count
    FROM public.driver_assignments da
    -- CRITICAL: Use existing helper function here too
    WHERE public._is_assignment_active_text(da.status::text, da.completed_at, da.is_active)
    GROUP BY da.driver_id
  ) active_assignments ON active_assignments.driver_id = d.id
  WHERE d.tenant_id = p_tenant_id
    AND d.is_active = true
  ORDER BY d.full_name ASC;
END
$$;

-- GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.get_unassigned_pickup_orders(bigint, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_available_drivers_for_tenant(bigint) TO authenticated, service_role;

-- RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';