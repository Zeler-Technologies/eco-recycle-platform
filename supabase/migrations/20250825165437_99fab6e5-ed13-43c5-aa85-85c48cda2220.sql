-- Create function to synchronize status between pickup_orders and customer_requests
CREATE OR REPLACE FUNCTION sync_pickup_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When pickup_orders.status changes, sync it to customer_requests.status
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE customer_requests 
        SET 
            status = NEW.status,
            updated_at = now()
        WHERE id = NEW.customer_request_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync status changes
DROP TRIGGER IF EXISTS trigger_sync_pickup_status ON pickup_orders;
CREATE TRIGGER trigger_sync_pickup_status
    AFTER INSERT OR UPDATE OF status ON pickup_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_pickup_status();

-- Create unified view for all pickup data with consistent status
CREATE OR REPLACE VIEW v_unified_pickup_status AS
SELECT 
    po.id as pickup_order_id,
    po.customer_request_id,
    po.status as current_status,
    po.scheduled_pickup_date,
    po.actual_pickup_date,
    po.assigned_driver_id,
    po.driver_name,
    po.driver_notes,
    po.completion_photos,
    po.final_price,
    po.tenant_id,
    po.created_at as pickup_created_at,
    po.updated_at as pickup_updated_at,
    cr.owner_name,
    cr.contact_phone,
    cr.pickup_address,
    cr.pickup_postal_code,
    cr.car_brand,
    cr.car_model,
    cr.car_year,
    cr.car_registration_number,
    cr.estimated_value,
    cr.quote_amount,
    cr.pickup_latitude,
    cr.pickup_longitude,
    cr.scrapyard_id,
    cr.created_at as request_created_at
FROM pickup_orders po
LEFT JOIN customer_requests cr ON po.customer_request_id = cr.id;

-- Grant permissions on the view
GRANT SELECT ON v_unified_pickup_status TO authenticated;
GRANT SELECT ON v_unified_pickup_status TO anon;