-- Create a safe RPC to list accessible scrapyyards for the current user
-- Uses SECURITY DEFINER to bypass problematic RLS and applies our own access rules
CREATE OR REPLACE FUNCTION public.list_scrapyards_for_current_user()
RETURNS TABLE(id bigint, name text, tenant_id bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_role public.user_role;
  v_tenant_id bigint;
BEGIN
  -- Try to read role and tenant from auth_users (RLS bypassed by SECURITY DEFINER)
  SELECT role, tenant_id
  INTO v_role, v_tenant_id
  FROM public.auth_users
  WHERE id = auth.uid();

  -- Super admins see all scrapyards
  IF v_role = 'super_admin'::public.user_role THEN
    RETURN QUERY
      SELECT s.id, s.name, s.tenant_id
      FROM public.scrapyards s
      ORDER BY s.name ASC;
    RETURN;
  END IF;

  -- Tenant-scoped users: list scrapyards in their tenant
  IF v_tenant_id IS NOT NULL THEN
    RETURN QUERY
      SELECT s.id, s.name, s.tenant_id
      FROM public.scrapyards s
      WHERE s.tenant_id = v_tenant_id
      ORDER BY s.name ASC;
    RETURN;
  END IF;

  -- Fallback: no access
  RETURN;
END;
$$;