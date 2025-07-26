-- Allow anonymous users to insert and update car metadata
-- Since car_metadata is linked to customer_requests, anonymous users should be able to manage it

-- Allow anyone to insert car metadata (since they need to create it when submitting requests)
CREATE POLICY "Allow anonymous users to create car metadata" 
ON public.car_metadata 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update car metadata (for adding parts info)
CREATE POLICY "Allow anonymous users to update car metadata" 
ON public.car_metadata 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow anyone to read car metadata (for viewing their submissions)
CREATE POLICY "Allow anonymous users to view car metadata" 
ON public.car_metadata 
FOR SELECT 
USING (true);