-- Allow drivers to create pickup status updates for their assigned orders
CREATE POLICY "Drivers can create status updates for assigned pickups" 
ON public.pickup_status_updates 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.pickup_orders po
    JOIN public.drivers d ON d.id = po.assigned_driver_id
    WHERE po.id = pickup_status_updates.pickup_order_id 
    AND d.auth_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.driver_assignments da
    JOIN public.drivers d ON d.id = da.driver_id
    WHERE da.pickup_order_id = pickup_status_updates.pickup_order_id 
    AND d.auth_user_id = auth.uid()
    AND da.is_active = true
  )
);