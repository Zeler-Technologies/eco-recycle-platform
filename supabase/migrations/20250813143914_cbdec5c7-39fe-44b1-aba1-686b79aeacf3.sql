-- Fix infinite recursion in scrapyards table policies
-- by simplifying RLS policies to avoid circular dependencies

-- Drop ALL existing policies on scrapyards that may cause recursion
DROP POLICY IF EXISTS "Allow everyone to view active scrapyards" ON public.scrapyards;
DROP POLICY IF EXISTS "Only super admins can delete scrapyards" ON public.scrapyards;
DROP POLICY IF EXISTS "Super admins can see all scrapyards" ON public.scrapyards;
DROP POLICY IF EXISTS "Super admins can update scrapyards" ON public.scrapyards;
DROP POLICY IF EXISTS "Super admins can view all scrapyards" ON public.scrapyards;
DROP POLICY IF EXISTS "Tenant admins can update their scrapyards" ON public.scrapyards;
DROP POLICY IF EXISTS "Users can see scrapyards they have access to" ON public.scrapyards;
DROP POLICY IF EXISTS "Users can update their scrapyard details" ON public.scrapyards;
DROP POLICY IF EXISTS "Users can view scrapyards they have access to" ON public.scrapyards;
DROP POLICY IF EXISTS "Users can view their scrapyard" ON public.scrapyards;

-- Create simple, working policies for scrapyards
CREATE POLICY "Allow public read access to active scrapyards"
ON public.scrapyards
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Allow authenticated users full access to scrapyards"
ON public.scrapyards
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure the find_nearby_scrapyards function can work
-- First check if the function exists and recreate it with security definer
DROP FUNCTION IF EXISTS public.find_nearby_scrapyards(numeric, numeric, integer);

CREATE OR REPLACE FUNCTION public.find_nearby_scrapyards(
  p_latitude numeric,
  p_longitude numeric,
  p_max_distance integer DEFAULT 100
)
RETURNS TABLE(
  id bigint,
  name text,
  address text,
  city text,
  distance_km numeric,
  tenant_id bigint,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.address,
    s.city,
    CASE 
      WHEN s.latitude IS NOT NULL AND s.longitude IS NOT NULL THEN
        (6371 * acos(
          cos(radians(p_latitude)) * cos(radians(s.latitude)) * 
          cos(radians(s.longitude) - radians(p_longitude)) + 
          sin(radians(p_latitude)) * sin(radians(s.latitude))
        ))
      ELSE NULL
    END AS distance_km,
    s.tenant_id,
    s.is_active
  FROM 
    public.scrapyards s
  WHERE 
    s.is_active = true
    AND (
      s.latitude IS NULL OR s.longitude IS NULL OR
      (6371 * acos(
        cos(radians(p_latitude)) * cos(radians(s.latitude)) * 
        cos(radians(s.longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * sin(radians(s.latitude))
      )) <= p_max_distance
    )
  ORDER BY 
    distance_km ASC NULLS LAST,
    s.name ASC;
END;
$$;