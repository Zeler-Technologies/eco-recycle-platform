-- Add latitude/longitude fields to tenants table for "basadress"
ALTER TABLE public.tenants 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN base_address TEXT;

-- Create customer_requests table
CREATE TABLE public.customer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id BIGINT REFERENCES public.tenants(tenants_id),
  car_registration_number TEXT NOT NULL,
  car_brand TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_year INTEGER,
  control_number TEXT,
  owner_name TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  owner_postal_code TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_postal_code TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'pending',
  quote_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pickup_orders table
CREATE TABLE public.pickup_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_request_id UUID REFERENCES public.customer_requests(id) ON DELETE CASCADE,
  tenant_id BIGINT REFERENCES public.tenants(tenants_id),
  driver_name TEXT,
  scheduled_pickup_date DATE,
  actual_pickup_date DATE,
  status TEXT DEFAULT 'scheduled',
  final_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scrap_yard_locations table
CREATE TABLE public.scrap_yard_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id BIGINT REFERENCES public.tenants(tenants_id) UNIQUE,
  service_radius_km INTEGER DEFAULT 50,
  priority_position INTEGER DEFAULT 0,
  bidding_amount DECIMAL(10, 2) DEFAULT 0,
  is_premium_listed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bidding_system table
CREATE TABLE public.bidding_system (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id BIGINT REFERENCES public.tenants(tenants_id),
  bid_amount DECIMAL(10, 2) NOT NULL,
  bid_start_date DATE NOT NULL,
  bid_end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create price_viewing_payments table
CREATE TABLE public.price_viewing_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stripe_session_id TEXT,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrap_yard_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bidding_system ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_viewing_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_requests
CREATE POLICY "Customers can view their own requests" 
ON public.customer_requests 
FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Customers can create their own requests" 
ON public.customer_requests 
FOR INSERT 
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Tenants can view requests in their area" 
ON public.customer_requests 
FOR SELECT 
USING (tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info()));

CREATE POLICY "Tenants can update requests assigned to them" 
ON public.customer_requests 
FOR UPDATE 
USING (tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info()));

-- RLS Policies for pickup_orders
CREATE POLICY "Customers can view their pickup orders" 
ON public.pickup_orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.customer_requests cr 
  WHERE cr.id = pickup_orders.customer_request_id 
  AND cr.customer_id = auth.uid()
));

CREATE POLICY "Tenants can manage their pickup orders" 
ON public.pickup_orders 
FOR ALL 
USING (tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info()));

-- RLS Policies for scrap_yard_locations
CREATE POLICY "Public can view scrap yard locations" 
ON public.scrap_yard_locations 
FOR SELECT 
USING (true);

CREATE POLICY "Tenants can manage their location settings" 
ON public.scrap_yard_locations 
FOR ALL 
USING (tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info()));

-- RLS Policies for bidding_system
CREATE POLICY "Tenants can manage their bids" 
ON public.bidding_system 
FOR ALL 
USING (tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info()));

CREATE POLICY "Super admins can view all bids" 
ON public.bidding_system 
FOR SELECT 
USING ((SELECT get_current_user_info.user_role FROM get_current_user_info()) = 'super_admin');

-- RLS Policies for price_viewing_payments
CREATE POLICY "Customers can view their own payments" 
ON public.price_viewing_payments 
FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Customers can create their own payments" 
ON public.price_viewing_payments 
FOR INSERT 
WITH CHECK (customer_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_customer_requests_updated_at
  BEFORE UPDATE ON public.customer_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pickup_orders_updated_at
  BEFORE UPDATE ON public.pickup_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scrap_yard_locations_updated_at
  BEFORE UPDATE ON public.scrap_yard_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bidding_system_updated_at
  BEFORE UPDATE ON public.bidding_system
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();