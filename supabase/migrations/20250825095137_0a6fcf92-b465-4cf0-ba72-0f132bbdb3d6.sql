-- 1) First check if table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'pickup_orders';

-- 2) Drop and recreate pickup_orders table completely
DROP TABLE IF EXISTS public.pickup_orders CASCADE;

CREATE TABLE public.pickup_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_request_id UUID NOT NULL,
    tenant_id BIGINT NOT NULL,
    driver_id UUID NULL,
    assigned_driver_id UUID NULL,
    driver_name TEXT,
    scheduled_pickup_date DATE,
    actual_pickup_date DATE,
    status TEXT DEFAULT 'scheduled',
    final_price NUMERIC,
    driver_notes TEXT,
    completion_photos TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Add foreign key constraints AFTER table creation
ALTER TABLE public.pickup_orders 
ADD CONSTRAINT fk_pickup_orders_customer_request 
FOREIGN KEY (customer_request_id) REFERENCES public.customer_requests(id) ON DELETE CASCADE;

ALTER TABLE public.pickup_orders 
ADD CONSTRAINT fk_pickup_orders_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenants_id);

ALTER TABLE public.pickup_orders 
ADD CONSTRAINT fk_pickup_orders_driver 
FOREIGN KEY (driver_id) REFERENCES public.drivers(id);

-- 4) Create indexes
CREATE INDEX idx_pickup_orders_tenant ON public.pickup_orders(tenant_id);
CREATE INDEX idx_pickup_orders_driver ON public.pickup_orders(driver_id);
CREATE INDEX idx_pickup_orders_status ON public.pickup_orders(status);

-- 5) Enable RLS
ALTER TABLE public.pickup_orders ENABLE ROW LEVEL SECURITY;

-- 6) Create simple RLS policy for testing
CREATE POLICY "Allow all for authenticated users (temporary)" 
ON public.pickup_orders FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 7) Grant table permissions
GRANT ALL ON public.pickup_orders TO authenticated;
GRANT ALL ON public.pickup_orders TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 8) Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pickup_orders_updated_at
    BEFORE UPDATE ON public.pickup_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9) Insert some test data
INSERT INTO public.pickup_orders (customer_request_id, tenant_id, status) 
SELECT 
    cr.id,
    cr.tenant_id,
    'scheduled'
FROM public.customer_requests cr 
WHERE cr.tenant_id IS NOT NULL 
LIMIT 3;

-- 10) Force PostgREST to reload
NOTIFY pgrst, 'reload schema';