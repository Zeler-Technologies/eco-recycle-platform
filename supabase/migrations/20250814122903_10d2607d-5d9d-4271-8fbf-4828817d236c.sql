-- EMERGENCY FIX: Super Admin Access Restoration
-- This fixes the tenant isolation that accidentally blocked super admin

-- Step 1: Check current state (run first to see what we have)
SELECT 'auth_users super admin check:' as check_type, 
       id, email, role 
FROM public.auth_users 
WHERE role::text = 'super_admin';

SELECT 'user_roles table check:' as check_type,
       COUNT(*) as total_records
FROM public.user_roles;

-- Step 2: Add super admin to user_roles table (corrected syntax)
-- Remove the problematic ON CONFLICT clause since we don't know the exact constraints
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::user_role
FROM public.auth_users 
WHERE role::text = 'super_admin'
AND id NOT IN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'super_admin'
);

-- Step 3: Verify the fix
SELECT 'Verification - user_roles after insert:' as check_type,
       ur.user_id, ur.role, au.email
FROM public.user_roles ur
JOIN public.auth_users au ON ur.user_id = au.id
WHERE ur.role = 'super_admin';

-- Step 4: Create a backup super admin access policy (if current ones fail)
-- This ensures super admin can always access tenants table
DROP POLICY IF EXISTS "emergency_super_admin_access" ON public.tenants;
CREATE POLICY "emergency_super_admin_access" ON public.tenants
FOR ALL USING (
    -- Check both possible locations for super admin status
    EXISTS (
        SELECT 1 FROM public.auth_users 
        WHERE id = auth.uid() 
        AND role::text = 'super_admin'
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Step 5: Test the fix by checking what the super admin can see
SELECT 'Super admin tenant access test:' as test_type,
       COUNT(*) as visible_tenants
FROM public.tenants;