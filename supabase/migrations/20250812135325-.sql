-- Ensure RLS is enabled on user_roles (safe if already enabled)
alter table if exists public.user_roles enable row level security;

-- 1) Helper function to avoid RLS recursion when resolving tenant for a scrapyard
create or replace function public.get_scrapyard_tenant_id(p_scrapyard_id bigint)
returns bigint
language sql
stable
security definer
set search_path = 'public'
as $$
  select tenant_id from public.scrapyards where id = p_scrapyard_id;
$$;

-- 2) Replace/ensure a non-recursive SELECT policy on user_roles for tenant_admins
-- Drop old policy if it exists
drop policy if exists "tenant_admins_select_user_roles_tenant" on public.user_roles;

create policy "tenant_admins_select_user_roles_tenant"
on public.user_roles
for select
to authenticated
using (
  (( select get_current_user_info.user_role
      from get_current_user_info() get_current_user_info(user_role, tenant_id)
    ) = 'tenant_admin'::user_role)
  and
  (( select get_current_user_info.tenant_id
      from get_current_user_info() get_current_user_info(user_role, tenant_id)
    ) = public.get_scrapyard_tenant_id(user_roles.scrapyard_id))
);

-- Ask PostgREST to reload
notify pgrst, 'reload schema';