-- Fix the distance calculation to return numeric type
CREATE OR REPLACE FUNCTION public.find_nearby_scrapyards(
    p_latitude numeric, 
    p_longitude numeric, 
    p_max_distance integer DEFAULT 50
)
RETURNS TABLE(
    id bigint, 
    name text, 
    address text, 
    postal_code text, 
    city text, 
    latitude numeric, 
    longitude numeric, 
    distance_km numeric, 
    max_capacity integer, 
    active_requests bigint, 
    availability_status text, 
    opening_time time without time zone, 
    closing_time time without time zone, 
    operating_days text[]
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.address,
        s.postal_code,
        s.city,
        s.latitude,
        s.longitude,
        -- Cast the distance calculation to numeric to match return type
        (
            6371 * acos(
                cos(radians(p_latitude::double precision)) * cos(radians(s.latitude::double precision)) * 
                cos(radians(s.longitude::double precision) - radians(p_longitude::double precision)) + 
                sin(radians(p_latitude::double precision)) * sin(radians(s.latitude::double precision))
            )
        )::numeric AS distance_km,
        s.max_capacity,
        -- Calculate current capacity based on active requests
        (
            SELECT COUNT(*)::bigint
            FROM public.customer_requests cr
            WHERE cr.scrapyard_id = s.id
            AND cr.status IN ('assigned', 'in_progress')
        ) AS active_requests,
        -- Availability status
        CASE
            WHEN (
                SELECT COUNT(*)
                FROM public.customer_requests cr
                WHERE cr.scrapyard_id = s.id
                AND cr.status IN ('assigned', 'in_progress')
            ) < s.max_capacity THEN 'available'
            ELSE 'at_capacity'
        END AS availability_status,
        s.opening_time,
        s.closing_time,
        s.operating_days
    FROM 
        public.scrapyards s
    WHERE 
        s.is_active = true
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
        -- Filter by distance
        AND (
            6371 * acos(
                cos(radians(p_latitude::double precision)) * cos(radians(s.latitude::double precision)) * 
                cos(radians(s.longitude::double precision) - radians(p_longitude::double precision)) + 
                sin(radians(p_latitude::double precision)) * sin(radians(s.latitude::double precision))
            )
        ) <= p_max_distance
    ORDER BY 
        distance_km ASC;
END;
$function$;