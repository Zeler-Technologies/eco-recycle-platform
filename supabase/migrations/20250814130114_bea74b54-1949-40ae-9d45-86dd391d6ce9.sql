-- COMPREHENSIVE SYSTEM TENANT FIX
-- Add missing columns and implement system tenant

-- Step 1: Add updated_at columns to all tables that need them
ALTER TABLE bonus_offers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE distance_rules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE custom_message_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE scrap_yard_locations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE bidding_system ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE scrapyards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE pricing_tiers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Create System Tenant (ID 0)
INSERT INTO tenants (tenants_id, name, country, date, created_at, updated_at)
VALUES (
    0,
    'Platform Operations',
    'SE',
    CURRENT_DATE,
    NOW(),
    NOW()
) ON CONFLICT (tenants_id) DO NOTHING;

-- Step 3: Just create a simple RLS policy that allows super admins
DROP POLICY IF EXISTS "super_admin_full_access" ON tenants;
CREATE POLICY "super_admin_full_access" ON tenants
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth_users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'::user_role
    )
);

-- Step 4: Test that tenants are now visible
SELECT 'SUPER ADMIN ACCESS RESTORED!' as result, COUNT(*) as tenant_count FROM tenants;