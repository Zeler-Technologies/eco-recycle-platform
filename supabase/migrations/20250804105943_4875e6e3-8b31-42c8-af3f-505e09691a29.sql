-- Temporary bypass policy for drivers table to allow creation during testing
CREATE POLICY "Temporary bypass for driver creation" 
ON public.drivers 
FOR ALL 
USING (true) 
WITH CHECK (true);