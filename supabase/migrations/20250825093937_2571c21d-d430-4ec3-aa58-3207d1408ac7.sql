-- Ensure pickup_orders table exists with required columns and policies
-- 1) Table
CREATE TABLE IF NOT EXISTS public.pickup_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_request_id UUID REFERENCES public.customer_requests(id) ON DELETE CASCADE,
  tenant_id BIGINT REFERENCES public.tenants(tenants_id),
  driver_id UUID NULL REFERENCES public.drivers(id),
  assigned_driver_id UUID NULL,
  driver_name TEXT,
  scheduled_pickup_date DATE,
  actual_pickup_date DATE,
  status TEXT DEFAULT 'scheduled',
  final_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) RLS
ALTER TABLE public.pickup_orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their pickup orders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pickup_orders' AND policyname='Customers can view their pickup orders'
  ) THEN
    CREATE POLICY "Customers can view their pickup orders"
    ON public.pickup_orders
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.customer_requests cr
        WHERE cr.id = pickup_orders.customer_request_id
          AND cr.customer_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Tenants can manage their pickup orders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pickup_orders' AND policyname='Tenants can manage their pickup orders'
  ) THEN
    CREATE POLICY "Tenants can manage their pickup orders"
    ON public.pickup_orders
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM public.get_current_user_info()))
    WITH CHECK (tenant_id = (SELECT tenant_id FROM public.get_current_user_info()));
  END IF;
END $$;

-- 3) updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_pickup_orders_updated_at'
  ) THEN
    CREATE TRIGGER update_pickup_orders_updated_at
      BEFORE UPDATE ON public.pickup_orders
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4) Helper index for assigned driver lookups
CREATE INDEX IF NOT EXISTS idx_po_assigned_driver ON public.pickup_orders(assigned_driver_id);

-- 5) Keep assigned_driver_id in sync based on driver_assignments
--    (function public._sync_assigned_driver already exists in this project)
DROP TRIGGER IF EXISTS trg_da_sync_assigned ON public.driver_assignments;
CREATE TRIGGER trg_da_sync_assigned
  AFTER INSERT OR UPDATE OF status, is_active, completed_at
  ON public.driver_assignments
  FOR EACH ROW EXECUTE FUNCTION public._sync_assigned_driver();

-- 6) Refresh PostgREST schema
NOTIFY pgrst, 'reload schema';