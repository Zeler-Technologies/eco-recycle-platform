-- Allow anonymous users to create customer requests temporarily
-- This will allow the customer app to work without authentication

-- First drop the existing policy that requires authentication
DROP POLICY IF EXISTS "Customers can create their own requests" ON public.customer_requests;

-- Create a new policy that allows anonymous customer request creation
CREATE POLICY "Allow anonymous customer requests" 
ON public.customer_requests 
FOR INSERT 
WITH CHECK (true);

-- Keep the existing view policy for authenticated users
-- Customers can still view their own requests if they're authenticated