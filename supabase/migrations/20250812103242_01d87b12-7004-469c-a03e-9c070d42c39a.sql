
-- 1) Helper: centralized, TEXT-based active-assignment predicate (no enum casts)
CREATE OR REPLACE FUNCTION public._is_assignment_active_text(
  p_status_text text,
  p_completed_at timestamptz,
  p_is_active boolean
) RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_is_active, TRUE)
     AND p_completed_at IS NULL
     AND p_status_text NOT IN ('completed','canceled','failed')
$$;

-- 2) list_available_pickup_requests: use helper and avoid enum casts entirely
CREATE OR REPLACE FUNCTION public.list_available_pickup_requests(
  p_driver_id uuid,
  p_limit int DEFAULT 50
) RETURNS TABLE (
  pickup_order_id uuid,
  customer_request_id uuid,
  owner_name text,
  car_brand text,
  car_model text,
  car_year int,
  pickup_address text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  scheduled_pickup_date date,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
AS $$
DECLARE
  v_user   uuid := auth.uid();
  v_tenant bigint;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT tenant_id INTO v_tenant
  FROM public.drivers
  WHERE id = p_driver_id
  LIMIT 1;

  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Driver not found or missing tenant';
  END IF;

  RETURN QUERY
  WITH candidate_po AS (
    SELECT po.*
    FROM public.pickup_orders po
    WHERE po.tenant_id = v_tenant
      AND COALESCE(po.status, 'scheduled') IN ('scheduled','pending')
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
    cr.car_brand,
    cr.car_model,
    cr.car_year,
    cr.pickup_address,
    cr.pickup_latitude,
    cr.pickup_longitude,
    po.scheduled_pickup_date,
    po.status
  FROM candidate_po po
  LEFT JOIN public.customer_requests cr
    ON cr.id = po.customer_request_id
  ORDER BY COALESCE(po.scheduled_pickup_date, CURRENT_DATE) ASC, po.created_at ASC
  LIMIT p_limit;
END
$$;

-- 3) assign_driver_to_pickup: tenant guard, active-exists check via helper, insert + sync
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
  v_po_tenant     bigint;
  v_assignment_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT tenant_id INTO v_driver_tenant FROM public.drivers       WHERE id = p_driver_id;
  SELECT tenant_id INTO v_po_tenant     FROM public.pickup_orders WHERE id = p_pickup_order_id;

  IF v_driver_tenant IS NULL OR v_po_tenant IS NULL OR v_driver_tenant <> v_po_tenant THEN
    RAISE EXCEPTION 'Tenant mismatch or missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.driver_assignments da
    WHERE da.pickup_order_id = p_pickup_order_id
      AND public._is_assignment_active_text(da.status::text, da.completed_at, da.is_active)
  ) THEN
    RAISE EXCEPTION 'Pickup order already has an active assignment';
  END IF;

  INSERT INTO public.driver_assignments (
    driver_id, pickup_order_id, status, assigned_at, notes, is_active, role
  )
  VALUES (
    p_driver_id, p_pickup_order_id, 'scheduled', now(), p_notes, true, 'primary'
  )
  RETURNING id INTO v_assignment_id;

  -- Keep a convenience shortcut up to date for the app (assigned_driver_id is also kept in sync by trigger)
  UPDATE public.pickup_orders
     SET driver_id = p_driver_id, updated_at = now()
   WHERE id = p_pickup_order_id;

  RETURN v_assignment_id;
END
$$;

-- 4) Ownership & grants
ALTER FUNCTION public.list_available_pickup_requests(uuid,int) OWNER TO postgres;
ALTER FUNCTION public.assign_driver_to_pickup(uuid,uuid,text)  OWNER TO postgres;

REVOKE ALL ON FUNCTION public.list_available_pickup_requests(uuid,int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_driver_to_pickup(uuid,uuid,text)  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_available_pickup_requests(uuid,int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_driver_to_pickup(uuid,uuid,text)  TO authenticated, service_role;

-- 5) Perf/safety indexes using the helper
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_assignment_per_pickup
  ON public.driver_assignments(pickup_order_id)
  WHERE public._is_assignment_active_text(status::text, completed_at, is_active);

CREATE INDEX IF NOT EXISTS idx_da_pickup_active
  ON public.driver_assignments(pickup_order_id)
  WHERE public._is_assignment_active_text(status::text, completed_at, is_active);

-- 6) Let PostgREST reload function definitions
NOTIFY pgrst, 'reload schema';
