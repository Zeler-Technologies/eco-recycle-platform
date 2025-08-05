-- Create a driver record for the demo driver user
INSERT INTO public.drivers (
    auth_user_id,
    full_name,
    email,
    phone_number,
    tenant_id,
    scrapyard_id,
    vehicle_type,
    vehicle_registration,
    driver_status,
    is_active
) VALUES (
    '27031d5a-8a17-4298-9ba3-2c74ac72fe48',
    'Demo Driver',
    'driver@scrapyard.se',
    '+46701234567',
    1,
    1,
    'Truck',
    'ABC123',
    'available',
    true
);