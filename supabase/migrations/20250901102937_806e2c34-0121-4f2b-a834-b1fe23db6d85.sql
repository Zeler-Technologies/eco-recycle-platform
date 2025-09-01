-- PHASE 1: Fix Database Data & Add Constraints

-- Step 1: Check current state (for logging)
-- Current primary scrapyards per tenant
SELECT 
    t.tenants_id,
    t.name as tenant_name,
    t.base_address as tenant_base_address,
    s.id as scrapyard_id,
    s.name as scrapyard_name, 
    s.address as scrapyard_address,
    s.is_primary
FROM tenants t
JOIN scrapyards s ON s.tenant_id = t.tenants_id  
WHERE t.tenants_id = 1
ORDER BY s.is_primary DESC, s.name;

-- Step 2: Fix Primary Scrapyard Assignment
-- Reset all scrapyards for tenant 1 to non-primary
UPDATE scrapyards 
SET is_primary = false 
WHERE tenant_id = 1;

-- Set Stockholm scrapyard as primary (matches tenant base address)
UPDATE scrapyards 
SET is_primary = true 
WHERE tenant_id = 1 
  AND (address ILIKE '%stockholm%' OR address ILIKE '%sveavägen%' OR name ILIKE '%stockholm%');

-- Step 3: Add Database Constraint to Prevent Multiple Primaries
-- Create unique partial index to ensure only one primary scrapyard per tenant
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_scrapyard_per_tenant 
ON public.scrapyards (tenant_id) 
WHERE is_primary = true;

-- Verification query
SELECT 
    t.name as tenant_name,
    s.name as scrapyard_name, 
    s.address,
    s.is_primary,
    CASE 
        WHEN s.address = t.base_address THEN 'CONSISTENT' 
        ELSE 'DIFFERENT' 
    END as address_consistency
FROM tenants t
JOIN scrapyards s ON s.tenant_id = t.tenants_id  
WHERE t.tenants_id = 1
ORDER BY s.is_primary DESC, s.name;