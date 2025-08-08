-- Drop the existing functions first
DROP FUNCTION IF EXISTS public.get_tenant_performance_analytics();
DROP FUNCTION IF EXISTS public.get_service_utilization_analytics();
DROP FUNCTION IF EXISTS public.get_request_trends_analytics();
DROP FUNCTION IF EXISTS public.get_billing_kpi_analytics();

-- Create corrected get_tenant_performance_analytics function
CREATE OR REPLACE FUNCTION public.get_tenant_performance_analytics()
RETURNS TABLE(
    tenant_id bigint,
    tenant_name text,
    active_drivers bigint,
    total_capacity_kg bigint,
    service_type text,
    request_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tenants_id AS tenant_id,
        t.name AS tenant_name,
        COALESCE(d.active_drivers, 0) AS active_drivers,
        COALESCE(d.total_capacity_kg, 0) AS total_capacity_kg,
        COALESCE(t.service_type, 'General Services') AS service_type,
        COALESCE(cr.request_count, 0) AS request_count
    FROM public.tenants t
    LEFT JOIN (
        SELECT
            tenant_id,
            COUNT(*) FILTER (WHERE is_active = true) AS active_drivers,
            COALESCE(SUM(max_capacity_kg) FILTER (WHERE is_active = true), 0) AS total_capacity_kg
        FROM public.drivers
        GROUP BY tenant_id
    ) d ON d.tenant_id = t.tenants_id
    LEFT JOIN (
        SELECT
            tenant_id,
            COUNT(*) AS request_count
        FROM public.customer_requests
        GROUP BY tenant_id
    ) cr ON cr.tenant_id = t.tenants_id
    ORDER BY COALESCE(d.active_drivers, 0) DESC;
END;
$$;

-- Create corrected get_service_utilization_analytics function
CREATE OR REPLACE FUNCTION public.get_service_utilization_analytics()
RETURNS TABLE(
    service_type text,
    total_capacity bigint,
    active_units bigint,
    utilization_rate numeric,
    avg_capacity_per_unit numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            SUM(max_capacity_kg) FILTER (WHERE is_active = true) AS total_capacity,
            COUNT(*) AS total_units,
            COUNT(*) FILTER (WHERE is_active = true) AS active_units
        FROM public.drivers
    )
    SELECT
        'Driver Services'::text AS service_type,
        COALESCE(total_capacity, 0) AS total_capacity,
        active_units,
        CASE 
            WHEN total_units > 0 THEN ROUND((active_units::numeric / total_units::numeric) * 100, 2)
            ELSE 0
        END AS utilization_rate,
        CASE 
            WHEN active_units > 0 THEN ROUND(total_capacity::numeric / active_units::numeric, 2)
            ELSE 0
        END AS avg_capacity_per_unit
    FROM stats;
END;
$$;

-- Create corrected get_request_trends_analytics function with configurable date range
CREATE OR REPLACE FUNCTION public.get_request_trends_analytics(days_back integer DEFAULT 30)
RETURNS TABLE(
    period_start date,
    period_end date,
    request_count bigint,
    avg_quote_amount numeric,
    completed_requests bigint,
    pending_requests bigint,
    completion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    WITH date_range AS (
        SELECT 
            (CURRENT_DATE - days_back)::date AS start_date,
            CURRENT_DATE::date AS end_date
    ),
    request_stats AS (
        SELECT
            COUNT(*) AS request_count,
            COALESCE(AVG(quote_amount), 0) AS avg_quote_amount,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_requests,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_requests
        FROM public.customer_requests cr
        CROSS JOIN date_range dr
        WHERE cr.created_at >= dr.start_date AND cr.created_at <= dr.end_date
    )
    SELECT
        dr.start_date AS period_start,
        dr.end_date AS period_end,
        rs.request_count,
        ROUND(rs.avg_quote_amount, 2) AS avg_quote_amount,
        rs.completed_requests,
        rs.pending_requests,
        CASE 
            WHEN rs.request_count > 0 THEN ROUND((rs.completed_requests::numeric / rs.request_count::numeric) * 100, 2)
            ELSE 0
        END AS completion_rate
    FROM date_range dr
    CROSS JOIN request_stats rs;
END;
$$;

-- Create corrected get_billing_kpi_analytics function using separate subqueries
CREATE OR REPLACE FUNCTION public.get_billing_kpi_analytics()
RETURNS TABLE(
    metric_name text,
    current_value numeric,
    previous_value numeric,
    change_percentage numeric,
    trend_direction text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    WITH current_metrics AS (
        SELECT
            (SELECT COUNT(*) FROM public.tenants) AS tenant_count,
            (SELECT COUNT(*) FROM public.drivers WHERE is_active = true) AS active_driver_count,
            (SELECT COUNT(*) FROM public.customer_requests) AS total_requests,
            (SELECT COALESCE(SUM(quote_amount), 0) FROM public.customer_requests) AS total_quotes
    )
    SELECT 'Total Tenants'::text AS metric_name, 
           tenant_count::numeric AS current_value, 
           8::numeric AS previous_value,
           CASE WHEN 8 > 0 THEN ROUND(((tenant_count - 8)::numeric / 8::numeric) * 100, 2) ELSE 0 END AS change_percentage,
           CASE WHEN tenant_count > 8 THEN 'up' ELSE 'down' END AS trend_direction
    FROM current_metrics
    
    UNION ALL
    
    SELECT 'Active Drivers'::text AS metric_name,
           active_driver_count::numeric AS current_value,
           25::numeric AS previous_value,
           CASE WHEN 25 > 0 THEN ROUND(((active_driver_count - 25)::numeric / 25::numeric) * 100, 2) ELSE 0 END AS change_percentage,
           CASE WHEN active_driver_count > 25 THEN 'up' ELSE 'down' END AS trend_direction
    FROM current_metrics
    
    UNION ALL
    
    SELECT 'Total Requests'::text AS metric_name,
           total_requests::numeric AS current_value,
           150::numeric AS previous_value,
           CASE WHEN 150 > 0 THEN ROUND(((total_requests - 150)::numeric / 150::numeric) * 100, 2) ELSE 0 END AS change_percentage,
           CASE WHEN total_requests > 150 THEN 'up' ELSE 'down' END AS trend_direction
    FROM current_metrics
    
    UNION ALL
    
    SELECT 'Total Quote Value'::text AS metric_name,
           total_quotes AS current_value,
           85000::numeric AS previous_value,
           CASE WHEN 85000 > 0 THEN ROUND(((total_quotes - 85000) / 85000) * 100, 2) ELSE 0 END AS change_percentage,
           CASE WHEN total_quotes > 85000 THEN 'up' ELSE 'down' END AS trend_direction
    FROM current_metrics
    
    ORDER BY metric_name;
END;
$$;