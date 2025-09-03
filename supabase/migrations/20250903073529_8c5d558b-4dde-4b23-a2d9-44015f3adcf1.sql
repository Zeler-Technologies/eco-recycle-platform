-- Add separate address fields to customer_requests table
ALTER TABLE public.customer_requests 
ADD COLUMN owner_street_address text,
ADD COLUMN owner_city text,
ADD COLUMN pickup_street_address text,
ADD COLUMN pickup_city text;

-- Add street_address to tenants table to replace base_address usage
ALTER TABLE public.tenants 
ADD COLUMN street_address text;

-- Create address formatting utility function
CREATE OR REPLACE FUNCTION public.format_full_address(
  p_street_address text DEFAULT NULL,
  p_postal_code text DEFAULT NULL, 
  p_city text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN TRIM(CONCAT_WS(', ', 
    NULLIF(TRIM(p_street_address), ''),
    NULLIF(TRIM(p_postal_code), ''),
    NULLIF(TRIM(p_city), '')
  ));
END;
$function$;

-- Create address parsing utility function
CREATE OR REPLACE FUNCTION public.parse_address(
  p_combined_address text
) RETURNS TABLE(
  street_address text,
  postal_code text,
  city text
)
LANGUAGE plpgsql
AS $function$
DECLARE
  parts text[];
  postal_pattern text := '\d{3}\s?\d{2}';
  postal_match text;
BEGIN
  IF p_combined_address IS NULL OR TRIM(p_combined_address) = '' THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;
  
  -- Split by comma and clean up
  parts := string_to_array(TRIM(p_combined_address), ',');
  
  -- Extract postal code using regex
  postal_match := (regexp_matches(p_combined_address, postal_pattern))[1];
  
  -- Basic parsing logic (can be enhanced)
  IF array_length(parts, 1) >= 3 THEN
    -- Format: street, postal, city
    RETURN QUERY SELECT 
      TRIM(parts[1]) as street_address,
      COALESCE(postal_match, TRIM(parts[2])) as postal_code,
      TRIM(parts[3]) as city;
  ELSIF array_length(parts, 1) = 2 THEN
    -- Format: street, postal+city 
    RETURN QUERY SELECT 
      TRIM(parts[1]) as street_address,
      postal_match as postal_code,
      TRIM(regexp_replace(parts[2], postal_pattern, '', 'g')) as city;
  ELSE
    -- Single field - try to extract components
    RETURN QUERY SELECT 
      TRIM(regexp_replace(p_combined_address, postal_pattern || '.*$', '')) as street_address,
      postal_match as postal_code,
      TRIM(regexp_replace(p_combined_address, '^.*' || postal_pattern || '\s*', '')) as city;
  END IF;
END;
$function$;