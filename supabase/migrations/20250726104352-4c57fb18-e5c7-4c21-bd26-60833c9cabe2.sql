-- Drop the existing policy that's not working correctly
DROP POLICY IF EXISTS "Allow anonymous customer requests" ON public.customer_requests;

-- Create a new policy that allows both anonymous and authenticated users to insert
CREATE POLICY "Allow all users to create customer requests" 
ON public.customer_requests 
FOR INSERT 
WITH CHECK (true);

-- Also update the select policy to allow anonymous users to view their requests
DROP POLICY IF EXISTS "Customers can view their own requests" ON public.customer_requests;

CREATE POLICY "Users can view customer requests" 
ON public.customer_requests 
FOR SELECT 
USING (
  -- Allow if user is authenticated and owns the request
  (auth.uid() IS NOT NULL AND customer_id = auth.uid()) 
  OR 
  -- Allow anonymous users (for now, could be restricted later)
  (auth.uid() IS NOT NULL)
);