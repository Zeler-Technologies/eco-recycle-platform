-- Enable Row Level Security and create proper policies for secure multi-tenant access

-- Enable RLS on critical tables
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Create security definer functions for role checks
CREATE OR REPLACE FUNCTION public.get_current_driver_info()
RETURNS TABLE(driver_id uuid, tenant_id bigint, user_role user_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT d.id, d.tenant_id, au.role
  FROM public.drivers d
  JOIN public.auth_users au ON d.auth_user_id = au.id
  WHERE au.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_safe()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auth_users 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id_safe()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.auth_users WHERE id = auth.uid();
$$;

-- Drivers table policies
CREATE POLICY "drivers_tenant_access" ON public.drivers
  FOR ALL USING (
    is_super_admin_safe() = true OR 
    tenant_id = get_user_tenant_id_safe() OR
    auth_user_id = auth.uid()
  )
  WITH CHECK (
    is_super_admin_safe() = true OR 
    tenant_id = get_user_tenant_id_safe() OR
    auth_user_id = auth.uid()
  );

-- Pickup orders policies
CREATE POLICY "pickup_orders_access" ON public.pickup_orders
  FOR ALL USING (
    is_super_admin_safe() = true OR
    tenant_id = get_user_tenant_id_safe() OR
    driver_id = (SELECT driver_id FROM get_current_driver_info())
  )
  WITH CHECK (
    is_super_admin_safe() = true OR
    tenant_id = get_user_tenant_id_safe()
  );

-- Driver assignments policies
CREATE POLICY "driver_assignments_access" ON public.driver_assignments
  FOR ALL USING (
    is_super_admin_safe() = true OR
    driver_id = (SELECT driver_id FROM get_current_driver_info()) OR
    EXISTS (
      SELECT 1 FROM pickup_orders po 
      WHERE po.id = pickup_order_id 
      AND po.tenant_id = get_user_tenant_id_safe()
    )
  )
  WITH CHECK (
    is_super_admin_safe() = true OR
    driver_id = (SELECT driver_id FROM get_current_driver_info()) OR
    EXISTS (
      SELECT 1 FROM pickup_orders po 
      WHERE po.id = pickup_order_id 
      AND po.tenant_id = get_user_tenant_id_safe()
    )
  );

-- Driver notifications policies
CREATE POLICY "driver_notifications_access" ON public.driver_notifications
  FOR ALL USING (
    is_super_admin_safe() = true OR
    driver_id = (SELECT driver_id FROM get_current_driver_info())
  )
  WITH CHECK (
    is_super_admin_safe() = true OR
    driver_id = (SELECT driver_id FROM get_current_driver_info())
  );

-- Driver locations policies  
CREATE POLICY "driver_locations_access" ON public.driver_locations
  FOR SELECT USING (
    is_super_admin_safe() = true OR
    EXISTS (
      SELECT 1 FROM drivers d 
      WHERE d.id = driver_id 
      AND d.tenant_id = get_user_tenant_id_safe()
    ) OR
    driver_id = (SELECT driver_id FROM get_current_driver_info())
  );

CREATE POLICY "driver_locations_insert" ON public.driver_locations
  FOR INSERT WITH CHECK (
    driver_id = (SELECT driver_id FROM get_current_driver_info())
  );

-- Verify security setup
SELECT 
    'RLS Security Setup Complete' as status,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ Protected'
        ELSE '❌ Unprotected'
    END as security_status
FROM pg_tables pt
LEFT JOIN pg_class pc ON pt.tablename = pc.relname
WHERE schemaname = 'public' 
AND tablename IN ('drivers', 'pickup_orders', 'driver_assignments', 'driver_notifications', 'driver_locations', 'auth_users')
ORDER BY tablename;