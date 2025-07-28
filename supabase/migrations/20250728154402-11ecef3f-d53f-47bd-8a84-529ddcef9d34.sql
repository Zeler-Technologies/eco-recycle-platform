-- Fix the get_active_tenant_bids function type mismatch
CREATE OR REPLACE FUNCTION public.get_active_tenant_bids(region_filter text DEFAULT NULL)
 RETURNS TABLE(scrapyard_id bigint, scrapyard_name text, bid_amount numeric, position_rank bigint, region_code text, end_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY INVOKER
AS $function$
BEGIN
  RETURN QUERY
  WITH ranked_bids AS (
    SELECT 
      tb.scrapyard_id,
      s.name AS scrapyard_name,
      tb.bid_amount,
      tb.region_code,
      tb.end_date,
      ROW_NUMBER() OVER (
        PARTITION BY COALESCE(tb.region_code, 'all')
        ORDER BY tb.bid_amount DESC, tb.created_at ASC
      ) AS calculated_rank
    FROM 
      public.tenant_bidding tb
      JOIN public.scrapyards s ON tb.scrapyard_id = s.id
    WHERE 
      tb.is_active = TRUE
      AND tb.end_date > NOW()
      AND (region_filter IS NULL OR tb.region_code = region_filter)
  )
  SELECT 
    rb.scrapyard_id,
    rb.scrapyard_name,
    rb.bid_amount,
    rb.calculated_rank AS position_rank,
    rb.region_code,
    rb.end_date
  FROM 
    ranked_bids rb
  ORDER BY 
    COALESCE(rb.region_code, 'all'),
    rb.calculated_rank;
END;
$function$;