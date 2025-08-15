-- Create customer user in auth_users table (fixed - exclude generated column)
INSERT INTO public.auth_users (
    id,
    email, 
    role,
    tenant_id,
    pnr_num,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'test@customer.se',
    'customer',
    NULL,
    '198001011234',
    now(),
    now()
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = now();