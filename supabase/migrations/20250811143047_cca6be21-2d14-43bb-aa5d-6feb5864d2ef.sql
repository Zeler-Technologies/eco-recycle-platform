-- Fix previous migration error and include owner_name
-- 1) Replace/ensure RPC with owner_name and logging
create or replace function public.list_available_pickup_requests(
  p_driver_id uuid,
  p_limit int default 50
) returns table (
  pickup_order_id uuid,
  customer_request_id uuid,
  owner_name text,
  car_brand text,
  car_model text,
  car_year int,
  pickup_address text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  scheduled_pickup_date date,
  status text
)
language plpgsql
security definer
set search_path = 'public, pg_temp'
as $$
declare
  v_user   uuid := auth.uid();
  v_tenant bigint;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select tenant_id into v_tenant
  from public.drivers
  where id = p_driver_id
  limit 1;

  if v_tenant is null then
    raise exception 'Driver not found or missing tenant';
  end if;

  -- Log invocation for auditability
  raise log 'list_available_pickup_requests called by %, driver=%', v_user, p_driver_id;

  return query
  with unassigned_po as (
    select po.*
    from public.pickup_orders po
    where po.tenant_id = v_tenant
      and coalesce(po.status,'scheduled') in ('scheduled','pending')
      and not exists (
        select 1
        from public.driver_assignments da
        where da.pickup_order_id = po.id
          and da.status in ('scheduled','in_progress')
          and da.completed_at is null
      )
  )
  select
    po.id as pickup_order_id,
    po.customer_request_id,
    cr.owner_name,
    cr.car_brand,
    cr.car_model,
    cr.car_year,
    cr.pickup_address,
    cr.pickup_latitude,
    cr.pickup_longitude,
    po.scheduled_pickup_date,
    po.status
  from unassigned_po po
  left join public.customer_requests cr on cr.id = po.customer_request_id
  order by coalesce(po.scheduled_pickup_date, current_date) asc, po.created_at asc
  limit p_limit;
end
$$;

grant execute on function public.list_available_pickup_requests(uuid, int) to authenticated, service_role;

-- 2) Drop existing policies on user_roles using correct column name "policyname"
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname='public' and tablename='user_roles'
  loop
    execute format('drop policy if exists %I on public.user_roles', r.policyname);
  end loop;
end $$;

alter table public.user_roles enable row level security;

-- a) Users see their own role rows
create policy user_roles_select_own
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

-- b) Tenant admins see roles for scrapyards in their tenant (non-recursive)
create policy user_roles_select_by_tenant
on public.user_roles
for select
to authenticated
using (
  exists (
    select 1
    from public.auth_users au
    join public.scrapyards s on s.tenant_id = au.tenant_id
    where au.id = auth.uid()
      and au.role = 'tenant_admin'::user_role
      and s.id = user_roles.scrapyard_id
  )
);

-- c) Super admins see/manage all user_roles
create policy user_roles_select_all_super
on public.user_roles
for select
to authenticated
using (
  exists (select 1 from public.auth_users au
          where au.id = auth.uid() and au.role = 'super_admin'::user_role)
);

create policy user_roles_modify_super
on public.user_roles
for all
to authenticated
using (
  exists (select 1 from public.auth_users au
          where au.id = auth.uid() and au.role = 'super_admin'::user_role)
)
with check (
  exists (select 1 from public.auth_users au
          where au.id = auth.uid() and au.role = 'super_admin'::user_role)
);

-- 3) Ensure assign RPC exists with logging
create or replace function public.assign_driver_to_pickup(
  p_driver_id uuid,
  p_pickup_order_id uuid,
  p_notes text default null
) returns uuid
language plpgsql
security definer
set search_path = 'public, pg_temp'
as $$
declare
  v_user uuid := auth.uid();
  v_driver_tenant bigint;
  v_po_tenant     bigint;
  v_assignment_id uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select tenant_id into v_driver_tenant from public.drivers       where id = p_driver_id;
  select tenant_id into v_po_tenant     from public.pickup_orders where id = p_pickup_order_id;

  if v_driver_tenant is null or v_po_tenant is null or v_driver_tenant <> v_po_tenant then
    raise exception 'Tenant mismatch or missing';
  end if;

  if exists (
    select 1 from public.driver_assignments da
    where da.pickup_order_id = p_pickup_order_id
      and da.status in ('scheduled','in_progress')
      and da.completed_at is null
  ) then
    raise exception 'Pickup order already has an active assignment';
  end if;

  insert into public.driver_assignments (
    driver_id, pickup_order_id, status, assigned_at, notes, is_active, role
  )
  values (
    p_driver_id, p_pickup_order_id, 'scheduled', now(), p_notes, true, 'primary'
  )
  returning id into v_assignment_id;

  -- Log assignment for auditability
  raise log 'assign_driver_to_pickup by %: driver=% pickup=%', v_user, p_driver_id, p_pickup_order_id;

  return v_assignment_id;
end
$$;

grant execute on function public.assign_driver_to_pickup(uuid, uuid, text) to authenticated, service_role;

-- 4) Reload PostgREST
notify pgrst, 'reload schema';