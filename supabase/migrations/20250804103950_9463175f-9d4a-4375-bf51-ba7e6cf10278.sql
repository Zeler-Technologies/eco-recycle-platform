-- DROP the bypass policies Lovable suggested!
DROP POLICY IF EXISTS "Allow all operations on drivers (temporary)" ON public.drivers;
DROP POLICY IF EXISTS "Allow all operations on auth_users (temporary)" ON public.auth_users;

-- Create PROPER secure policies for drivers
CREATE POLICY "Super admin full access to drivers" ON public.drivers
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.auth_users au
    WHERE au.id = auth.uid()
    AND au.role = 'super_admin'
  )
);

CREATE POLICY "Admin tenant access to drivers" ON public.drivers  
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.auth_users au
    WHERE au.id = auth.uid()
    AND au.role = 'admin'
    AND au.tenant_id = drivers.tenant_id
  )
);

-- Create PROPER secure policies for auth_users
CREATE POLICY "Super admin manages all auth users" ON public.auth_users
FOR ALL TO authenticated  
USING (
  EXISTS (
    SELECT 1 FROM public.auth_users au
    WHERE au.id = auth.uid()
    AND au.role = 'super_admin'
  )
);

CREATE POLICY "Users can read own auth record" ON public.auth_users
FOR SELECT TO authenticated
USING (id = auth.uid());