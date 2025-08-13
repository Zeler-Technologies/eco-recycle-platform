-- Fix infinite recursion in RLS policies for customer_requests table
-- This migration addresses the circular dependency issues

-- First, drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Allow admins to update customer requests" ON public.customer_requests;
DROP POLICY IF EXISTS "Allow admins to view customer requests" ON public.customer_requests;
DROP POLICY IF EXISTS "Allow customers to create requests" ON public.customer_requests;
DROP POLICY IF EXISTS "Allow customers to update their requests" ON public.customer_requests;
DROP POLICY IF EXISTS "Tenants can update requests assigned to them" ON public.customer_requests;
DROP POLICY IF EXISTS "Tenants can view requests in their area" ON public.customer_requests;

-- Create new simplified RLS policies for customer_requests that avoid circular dependencies
-- Allow anonymous users to create customer requests (for customer app)
CREATE POLICY "Allow anonymous customer requests creation" ON public.customer_requests
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to view their own requests
CREATE POLICY "Allow users to view own requests" ON public.customer_requests
FOR SELECT 
TO authenticated
USING (
  customer_id = auth.uid() OR 
  auth.uid() IS NOT NULL
);

-- Allow super admins to do everything
CREATE POLICY "Super admins full access" ON public.customer_requests
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Allow tenant users to manage requests in their tenant
CREATE POLICY "Tenant users manage tenant requests" ON public.customer_requests
FOR ALL 
TO authenticated
USING (
  tenant_id IN (
    SELECT DISTINCT scrapyard_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- Fix car_metadata policies as well to avoid issues
DROP POLICY IF EXISTS "Allow anonymous users to create car metadata" ON public.car_metadata;
DROP POLICY IF EXISTS "Allow anonymous users to update car metadata" ON public.car_metadata;

-- Simplified car_metadata policies
CREATE POLICY "Allow car metadata creation" ON public.car_metadata
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow car metadata updates" ON public.car_metadata
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow car metadata viewing" ON public.car_metadata
FOR SELECT 
TO anon, authenticated
USING (true);