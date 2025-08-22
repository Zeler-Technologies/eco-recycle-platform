-- Update the 4-arg unified status function to auto-unassign drivers on cancelled/rejected
CREATE OR REPLACE FUNCTION public.update_pickup_status_unified(
  pickup_id uuid,
  new_status text,
  driver_notes_param text DEFAULT NULL::text,
  completion_photos_param text[] DEFAULT NULL::text[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  driver_authorized BOOLEAN := false;
  admin_authorized BOOLEAN := false;
  current_status TEXT;
  driver_id_val UUID;
BEGIN
  -- Get current status
  SELECT status INTO current_status 
  FROM public.pickup_orders 
  WHERE id = pickup_id;

  -- Check driver authorization (active assignment for this pickup)
  SELECT EXISTS(
           SELECT 1 
           FROM public.pickup_orders po
           JOIN public.driver_assignments da ON po.id = da.pickup_order_id
           JOIN public.drivers d ON da.driver_id = d.id
           WHERE po.id = pickup_id
             AND d.auth_user_id = auth.uid()
             AND da.is_active = true
             AND d.is_active = true
         ),
         da.driver_id
    INTO driver_authorized, driver_id_val
  FROM public.pickup_orders po
  JOIN public.driver_assignments da ON po.id = da.pickup_order_id
  JOIN public.drivers d ON da.driver_id = d.id
  WHERE po.id = pickup_id
    AND d.auth_user_id = auth.uid()
  LIMIT 1;

  -- Check admin authorization (tenant admin/super admin within same tenant)
  SELECT EXISTS(
           SELECT 1 
           FROM public.pickup_orders po
           JOIN public.auth_users au ON au.id = auth.uid()
           WHERE po.id = pickup_id
             AND po.tenant_id = au.tenant_id
             AND au.role IN ('tenant_admin', 'super_admin')
         )
    INTO admin_authorized;

  -- Authorization required
  IF NOT (driver_authorized OR admin_authorized) THEN
    RAISE EXCEPTION 'Unauthorized: Not assigned driver or tenant admin';
  END IF;

  -- Update pickup status (single source of truth)
  UPDATE public.pickup_orders
  SET 
    status = new_status,
    driver_notes = COALESCE(driver_notes_param, driver_notes),
    completion_photos = COALESCE(completion_photos_param, completion_photos),
    updated_at = NOW()
  WHERE id = pickup_id;

  -- Auto-unassign driver when pickup is cancelled or rejected
  IF new_status IN ('cancelled', 'rejected') THEN
    UPDATE public.driver_assignments
    SET 
      is_active = false,
      completed_at = NOW(),
      notes = COALESCE(notes, '') || ' [Auto-unassigned: pickup ' || new_status || ']'
    WHERE pickup_order_id = pickup_id 
      AND is_active = true;
  END IF;

  -- Best-effort logging (non-blocking)
  BEGIN
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
      current_status,
      new_status,
      driver_notes_param,
      completion_photos_param,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- ignore logging failures
  END;

  RETURN TRUE;
END;
$function$;