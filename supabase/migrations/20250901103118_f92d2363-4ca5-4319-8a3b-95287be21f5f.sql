-- Fix the primary scrapyard assignment without creating duplicate constraints

-- Step 1: Check current state 
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

-- Step 2: Fix Primary Scrapyard Assignment for tenant 1
-- Reset all scrapyards for tenant 1 to non-primary
UPDATE scrapyards 
SET is_primary = false 
WHERE tenant_id = 1;

-- Set Stockholm scrapyard as primary (matches tenant base address "Sveavägen 10, 12345, Stockholm")
UPDATE scrapyards 
SET is_primary = true 
WHERE tenant_id = 1 
  AND (address ILIKE '%sveavägen%' OR address ILIKE '%stockholm%' OR name ILIKE '%stockholm%');

-- Verification: Check if fix worked
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