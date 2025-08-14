-- Create missing enum types required by the database schema

-- Create user_role enum for auth_users table
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'tenant_admin', 
    'scrapyard_admin',
    'scrapyard_staff',
    'driver',
    'customer'
);

-- Create driver_status enum for drivers table
CREATE TYPE public.driver_status AS ENUM (
    'available',
    'busy', 
    'offline',
    'off_duty',
    'on_break'
);

-- Create car_status enum for cars table
CREATE TYPE public.car_status AS ENUM (
    'new',
    'pending',
    'approved',
    'picked_up',
    'processed',
    'completed',
    'cancelled'
);

-- Create treatment_type enum for cars table
CREATE TYPE public.treatment_type AS ENUM (
    'recycle',
    'scrap',
    'parts_harvest',
    'export'
);

-- Create assignment_status enum for driver_assignments table
CREATE TYPE public.assignment_status AS ENUM (
    'scheduled',
    'assigned',
    'accepted',
    'in_progress',
    'completed',
    'cancelled',
    'failed'
);

-- Create a simple function to get current user info that works with the new enum
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE(user_role public.user_role, tenant_id bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    COALESCE(au.role, 'customer'::public.user_role) as user_role,
    au.tenant_id
  FROM public.auth_users au 
  WHERE au.id = auth.uid();
$$;