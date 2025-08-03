-- Allow public read access to tenants table for super admin dashboard
-- Since we're using mock authentication, we need to allow unauthenticated access
CREATE POLICY "Allow public read access to tenants"
ON public.tenants
FOR SELECT
USING (true);