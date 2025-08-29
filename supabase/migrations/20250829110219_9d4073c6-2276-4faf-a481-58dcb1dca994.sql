-- PHASE 1: Comprehensive logging tables for PantaBilen
-- Note: We reference known tables with stable keys (pickup_orders.id, drivers.id).
-- For tenant_id we store bigint without FK due to varying PK naming in tenants table.

-- 1) pickup_logs: detailed event logging per pickup
CREATE TABLE IF NOT EXISTS public.pickup_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id bigint,
  pickup_order_id uuid REFERENCES public.pickup_orders(id) ON DELETE SET NULL,

  -- Event tracking
  event_type text NOT NULL CHECK (event_type IN ('created', 'assigned', 'accepted', 'started', 'completed', 'cancelled')),
  event_timestamp timestamptz DEFAULT now(),

  -- Customer & Vehicle Info (captured where relevant)
  customer_name text,
  customer_phone text,
  customer_email text,
  registration_number text,
  transportstyrelsen_id text,
  car_brand text,
  car_model text,
  car_year integer,

  -- Pickup details
  pickup_address text,
  pickup_date date,
  pickup_time time,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name text,

  -- Vehicle assessment (on completion)
  vehicle_condition text CHECK (vehicle_condition IN ('excellent', 'good', 'fair', 'poor', 'scrap')),
  has_catalytic_converter boolean,
  has_battery boolean,
  weight_kg numeric,
  condition_notes text,
  photos jsonb,

  -- Financial (on completion)
  quoted_price numeric,
  final_price numeric,
  price_adjustments jsonb,
  payment_method text CHECK (payment_method IN ('bank_transfer', 'swish', 'cash')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
  payment_reference text,

  -- SMS tracking summary
  sms_sent_count integer DEFAULT 0,
  sms_cost_total numeric DEFAULT 0.00,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) sms_logs: provider-level SMS logging
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id bigint,
  pickup_log_id bigint REFERENCES public.pickup_logs(id) ON DELETE SET NULL,
  pickup_order_id uuid REFERENCES public.pickup_orders(id) ON DELETE SET NULL,

  recipient_phone text NOT NULL,
  recipient_name text,
  message_type text NOT NULL CHECK (message_type IN ('initial_confirmation','reminder','status_update','completion_notice')),
  message_content text,

  cost_amount numeric NOT NULL DEFAULT 0.35,
  currency text DEFAULT 'SEK',

  provider text DEFAULT 'twilio',
  provider_message_id text,
  provider_response jsonb,

  status text DEFAULT 'sent' CHECK (status IN ('queued','sent','delivered','failed')),
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,

  created_at timestamptz DEFAULT now()
);

-- 3) daily_summaries: fast reporting rollups per day and tenant
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id BIGSERIAL PRIMARY KEY,
  tenant_id bigint,
  summary_date date NOT NULL,

  -- Pickup counts
  pickups_created integer DEFAULT 0,
  pickups_assigned integer DEFAULT 0,
  pickups_completed integer DEFAULT 0,
  pickups_cancelled integer DEFAULT 0,

  -- Revenue (SEK)
  total_revenue numeric DEFAULT 0,
  total_quoted numeric DEFAULT 0,
  average_pickup_value numeric DEFAULT 0,

  -- SMS metrics
  sms_sent integer DEFAULT 0,
  sms_cost numeric DEFAULT 0,
  sms_failed integer DEFAULT 0,

  -- Vehicle condition breakdown
  vehicles_excellent integer DEFAULT 0,
  vehicles_good integer DEFAULT 0,
  vehicles_fair integer DEFAULT 0,
  vehicles_poor integer DEFAULT 0,
  vehicles_scrap integer DEFAULT 0,

  -- Additional metrics
  total_weight_kg numeric DEFAULT 0,
  vehicles_with_catalytic integer DEFAULT 0,
  vehicles_with_battery integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, summary_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pickup_logs_tenant_date ON public.pickup_logs(tenant_id, pickup_date);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_event ON public.pickup_logs(event_type, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_sms_logs_tenant_date ON public.sms_logs(tenant_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_tenant ON public.daily_summaries(tenant_id, summary_date);

-- Enable RLS
ALTER TABLE public.pickup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pickup_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'pickup_logs' AND policyname = 'Tenants see own pickup logs'
  ) THEN
    CREATE POLICY "Tenants see own pickup logs" ON public.pickup_logs
      FOR SELECT
      USING (
        tenant_id = (
          SELECT get_current_user_info.tenant_id
          FROM get_current_user_info() get_current_user_info(user_role, tenant_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'pickup_logs' AND policyname = 'Super admins see all pickup logs'
  ) THEN
    CREATE POLICY "Super admins see all pickup logs" ON public.pickup_logs
      FOR SELECT
      USING (
        (
          SELECT get_current_user_info.user_role
          FROM get_current_user_info() get_current_user_info(user_role, tenant_id)
        ) = 'super_admin'::user_role
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'pickup_logs' AND policyname = 'Drivers can insert pickup logs'
  ) THEN
    CREATE POLICY "Drivers can insert pickup logs" ON public.pickup_logs
      FOR INSERT
      WITH CHECK (
        (
          driver_id = (
            SELECT get_current_driver_info.driver_id
            FROM get_current_driver_info() get_current_driver_info(driver_id, tenant_id, user_role)
          )
        )
        OR (
          (
            SELECT get_current_user_info.user_role
            FROM get_current_user_info() get_current_user_info(user_role, tenant_id)
          ) = 'super_admin'::user_role
        )
      );
  END IF;
END$$;

-- RLS Policies for sms_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'sms_logs' AND policyname = 'Tenants see own SMS logs'
  ) THEN
    CREATE POLICY "Tenants see own SMS logs" ON public.sms_logs
      FOR SELECT
      USING (
        tenant_id = (
          SELECT get_current_user_info.tenant_id
          FROM get_current_user_info() get_current_user_info(user_role, tenant_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'sms_logs' AND policyname = 'Super admins see all SMS logs'
  ) THEN
    CREATE POLICY "Super admins see all SMS logs" ON public.sms_logs
      FOR SELECT
      USING (
        (
          SELECT get_current_user_info.user_role
          FROM get_current_user_info() get_current_user_info(user_role, tenant_id)
        ) = 'super_admin'::user_role
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'sms_logs' AND policyname = 'System can insert SMS logs'
  ) THEN
    -- Allow inserts (e.g., from edge functions or authenticated clients)
    CREATE POLICY "System can insert SMS logs" ON public.sms_logs
      FOR INSERT
      WITH CHECK (true);
  END IF;
END$$;

-- RLS Policies for daily_summaries (read-only to clients)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'daily_summaries' AND policyname = 'Tenants see own summaries'
  ) THEN
    CREATE POLICY "Tenants see own summaries" ON public.daily_summaries
      FOR SELECT
      USING (
        tenant_id = (
          SELECT get_current_user_info.tenant_id
          FROM get_current_user_info() get_current_user_info(user_role, tenant_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'daily_summaries' AND policyname = 'Super admins see all summaries'
  ) THEN
    CREATE POLICY "Super admins see all summaries" ON public.daily_summaries
      FOR SELECT
      USING (
        (
          SELECT get_current_user_info.user_role
          FROM get_current_user_info() get_current_user_info(user_role, tenant_id)
        ) = 'super_admin'::user_role
      );
  END IF;
END$$;

-- Trigger to update daily summaries on pickup log insert
CREATE OR REPLACE FUNCTION public.update_daily_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.daily_summaries (
    tenant_id,
    summary_date,
    pickups_created,
    pickups_assigned,
    pickups_completed,
    pickups_cancelled,
    total_revenue,
    total_quoted
  ) VALUES (
    NEW.tenant_id,
    COALESCE(NEW.pickup_date, CURRENT_DATE),
    CASE WHEN NEW.event_type = 'created' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'assigned' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'cancelled' THEN 1 ELSE 0 END,
    COALESCE(NEW.final_price, 0),
    COALESCE(NEW.quoted_price, 0)
  )
  ON CONFLICT (tenant_id, summary_date)
  DO UPDATE SET
    pickups_created = public.daily_summaries.pickups_created + CASE WHEN NEW.event_type = 'created' THEN 1 ELSE 0 END,
    pickups_assigned = public.daily_summaries.pickups_assigned + CASE WHEN NEW.event_type = 'assigned' THEN 1 ELSE 0 END,
    pickups_completed = public.daily_summaries.pickups_completed + CASE WHEN NEW.event_type = 'completed' THEN 1 ELSE 0 END,
    pickups_cancelled = public.daily_summaries.pickups_cancelled + CASE WHEN NEW.event_type = 'cancelled' THEN 1 ELSE 0 END,
    total_revenue = public.daily_summaries.total_revenue + COALESCE(NEW.final_price, 0),
    total_quoted = public.daily_summaries.total_quoted + COALESCE(NEW.quoted_price, 0),
    vehicles_excellent = public.daily_summaries.vehicles_excellent + CASE WHEN NEW.event_type = 'completed' AND NEW.vehicle_condition = 'excellent' THEN 1 ELSE 0 END,
    vehicles_good = public.daily_summaries.vehicles_good + CASE WHEN NEW.event_type = 'completed' AND NEW.vehicle_condition = 'good' THEN 1 ELSE 0 END,
    vehicles_fair = public.daily_summaries.vehicles_fair + CASE WHEN NEW.event_type = 'completed' AND NEW.vehicle_condition = 'fair' THEN 1 ELSE 0 END,
    vehicles_poor = public.daily_summaries.vehicles_poor + CASE WHEN NEW.event_type = 'completed' AND NEW.vehicle_condition = 'poor' THEN 1 ELSE 0 END,
    vehicles_scrap = public.daily_summaries.vehicles_scrap + CASE WHEN NEW.event_type = 'completed' AND NEW.vehicle_condition = 'scrap' THEN 1 ELSE 0 END,
    vehicles_with_catalytic = public.daily_summaries.vehicles_with_catalytic + CASE WHEN NEW.event_type = 'completed' AND COALESCE(NEW.has_catalytic_converter, false) THEN 1 ELSE 0 END,
    vehicles_with_battery = public.daily_summaries.vehicles_with_battery + CASE WHEN NEW.event_type = 'completed' AND COALESCE(NEW.has_battery, false) THEN 1 ELSE 0 END,
    total_weight_kg = public.daily_summaries.total_weight_kg + COALESCE(NEW.weight_kg, 0),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_summary_on_pickup_log ON public.pickup_logs;
CREATE TRIGGER update_summary_on_pickup_log
AFTER INSERT ON public.pickup_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_summary();