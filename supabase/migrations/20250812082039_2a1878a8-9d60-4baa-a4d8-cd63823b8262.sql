
-- 0) Safety helpers
-- utility for "if table exists" checks inside DO blocks
-- (We'll use to_regclass('schema.table') IS NOT NULL in each block)

-- 1) Helpers (invoker, non-recursive, owned by postgres)
create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
set search_path = 'public, pg_temp'
as $$
  select role from public.auth_users where id = auth.uid()
$$;

create or replace function public.current_user_tenant()
returns bigint
language sql
stable
set search_path = 'public, pg_temp'
as $$
  select tenant_id from public.auth_users where id = auth.uid()
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
set search_path = 'public, pg_temp'
as $$
  select exists (
    select 1
    from public.auth_users au
    where au.id = auth.uid() and au.role = 'super_admin'
  )
$$;

create or replace function public.same_tenant(p_tenant bigint)
returns boolean
language sql
stable
set search_path = 'public, pg_temp'
as $$
  select public.is_super_admin()
         or (p_tenant is not null and p_tenant = public.current_user_tenant())
$$;

alter function public.current_user_id() owner to postgres;
alter function public.current_user_role() owner to postgres;
alter function public.current_user_tenant() owner to postgres;
alter function public.is_super_admin() owner to postgres;
alter function public.same_tenant(bigint) owner to postgres;

-- 2) user_roles — remove recursion, keep super_admin as only DML
-- Enable RLS
do $$
begin
  if to_regclass('public.user_roles') is not null then
    execute 'alter table public.user_roles enable row level security';
  end if;
end$$;

-- Drop only existing user_roles policies
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname='public' and tablename='user_roles'
  loop
    execute format('drop policy if exists %I on public.user_roles', r.policyname);
  end loop;
end$$;

-- Re-create minimal safe policies (no recursion)
create policy user_roles_self_select
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create policy user_roles_super_all
  on public.user_roles for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy user_roles_tenant_admin_select
  on public.user_roles for select to authenticated
  using (
    exists (
      select 1
      from public.auth_users au
      join public.scrapyards s on s.tenant_id = au.tenant_id
      where au.id = auth.uid()
        and au.role = 'tenant_admin'
        and s.id = user_roles.scrapyard_id
    )
  );

-- 3) Core table policies (idempotent, preserve anon insert on customer_requests)

-- DRIVERS
do $$
begin
  if to_regclass('public.drivers') is not null then
    execute 'alter table public.drivers enable row level security';

    execute 'drop policy if exists drivers_super_all on public.drivers';
    execute 'drop policy if exists drivers_tenant_rw on public.drivers';
    execute 'drop policy if exists drivers_tenant_mod on public.drivers';
    execute 'drop policy if exists drivers_self_rw on public.drivers';
    execute 'drop policy if exists drivers_self_update on public.drivers';

    execute $$create policy drivers_super_all
      on public.drivers for all to authenticated
      using (public.is_super_admin()) with check (public.is_super_admin())$$;

    execute $$create policy drivers_tenant_rw
      on public.drivers for select to authenticated
      using (public.same_tenant(tenant_id))$$;

    execute $$create policy drivers_tenant_mod
      on public.drivers for insert, update, delete to authenticated
      using (public.same_tenant(tenant_id)) with check (public.same_tenant(tenant_id))$$;

    execute $$create policy drivers_self_rw
      on public.drivers for select to authenticated
      using (auth_user_id = auth.uid())$$;

    execute $$create policy drivers_self_update
      on public.drivers for update to authenticated
      using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid())$$;
  end if;
end$$;

-- CUSTOMER_REQUESTS (preserve anon insert)
do $$
begin
  if to_regclass('public.customer_requests') is not null then
    execute 'alter table public.customer_requests enable row level security';

    execute 'drop policy if exists cr_super_all on public.customer_requests';
    execute 'drop policy if exists cr_tenant_rw on public.customer_requests';
    execute 'drop policy if exists cr_tenant_mod on public.customer_requests';

    execute $$create policy cr_super_all
      on public.customer_requests for all to authenticated
      using (public.is_super_admin()) with check (public.is_super_admin())$$;

    execute $$create policy cr_tenant_rw
      on public.customer_requests for select to authenticated
      using (public.same_tenant(tenant_id))$$;

    execute $$create policy cr_tenant_mod
      on public.customer_requests for update, delete to authenticated
      using (public.same_tenant(tenant_id)) with check (public.same_tenant(tenant_id))$$;
  end if;
end$$;

-- PICKUP_ORDERS (only if table exists)
do $$
begin
  if to_regclass('public.pickup_orders') is not null then
    execute 'alter table public.pickup_orders enable row level security';

    execute 'drop policy if exists po_super_all on public.pickup_orders';
    execute 'drop policy if exists po_tenant_rw on public.pickup_orders';
    execute 'drop policy if exists po_tenant_mod on public.pickup_orders';

    execute $$create policy po_super_all
      on public.pickup_orders for all to authenticated
      using (public.is_super_admin()) with check (public.is_super_admin())$$;

    execute $$create policy po_tenant_rw
      on public.pickup_orders for select to authenticated
      using (public.same_tenant(tenant_id))$$;

    execute $$create policy po_tenant_mod
      on public.pickup_orders for insert, update, delete to authenticated
      using (public.same_tenant(tenant_id)) with check (public.same_tenant(tenant_id))$$;
  end if;
end$$;

-- DRIVER_ASSIGNMENTS
do $$
begin
  if to_regclass('public.driver_assignments') is not null then
    execute 'alter table public.driver_assignments enable row level security';

    execute 'drop policy if exists da_super_all on public.driver_assignments';
    execute 'drop policy if exists da_tenant_rw on public.driver_assignments';
    execute 'drop policy if exists da_tenant_mod on public.driver_assignments';
    execute 'drop policy if exists da_driver_self_select on public.driver_assignments';
    execute 'drop policy if exists da_driver_self_update on public.driver_assignments';

    execute $$create policy da_super_all
      on public.driver_assignments for all to authenticated
      using (public.is_super_admin()) with check (public.is_super_admin())$$;

    execute $$create policy da_tenant_rw
      on public.driver_assignments for select to authenticated
      using (
        exists (select 1 from public.drivers d
                where d.id = driver_id and public.same_tenant(d.tenant_id))
      )$$;

    execute $$create policy da_tenant_mod
      on public.driver_assignments for insert, update, delete to authenticated
      using (
        exists (select 1 from public.drivers d
                where d.id = driver_id and public.same_tenant(d.tenant_id))
      )
      with check (
        exists (select 1 from public.drivers d
                where d.id = driver_id and public.same_tenant(d.tenant_id))
      )$$;

    execute $$create policy da_driver_self_select
      on public.driver_assignments for select to authenticated
      using (
        exists (select 1 from public.drivers d
                where d.id = driver_id and d.auth_user_id = auth.uid())
      )$$;

    execute $$create policy da_driver_self_update
      on public.driver_assignments for update to authenticated
      using (
        exists (select 1 from public.drivers d
                where d.id = driver_id and d.auth_user_id = auth.uid())
      )
      with check (
        exists (select 1 from public.drivers d
                where d.id = driver_id and d.auth_user_id = auth.uid())
      )$$;
  end if;
end$$;

-- DRIVER_STATUS_HISTORY
do $$
begin
  if to_regclass('public.driver_status_history') is not null then
    execute 'alter table public.driver_status_history enable row level security';

    execute 'drop policy if exists dsh_super_all on public.driver_status_history';
    execute 'drop policy if exists dsh_tenant_r on public.driver_status_history';
    execute 'drop policy if exists dsh_driver_self_r on public.driver_status_history';

    execute $$create policy dsh_super_all
      on public.driver_status_history for all to authenticated
      using (public.is_super_admin()) with check (public.is_super_admin())$$;

    execute $$create policy dsh_tenant_r
      on public.driver_status_history for select to authenticated
      using (public.same_tenant(tenant_id))$$;

    execute $$create policy dsh_driver_self_r
      on public.driver_status_history for select to authenticated
      using (
        exists (select 1 from public.drivers d
                where d.id = driver_id and d.auth_user_id = auth.uid())
      )$$;
  end if;
end$$;

-- 4) PNR — functions, types, generated columns, checks, normalized unique indexes

-- Normalizer (digits only)
create or replace function public._pnr_normalize(p text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(p,''), '\D', '', 'g')
$$;

-- Luhn-based validator, tolerant to 10/12 digits; normalize first
create or replace function public.validate_swedish_pnr(p text)
returns boolean
language plpgsql
immutable
as $$
declare
  d text := public._pnr_normalize(p);
  sum int := 0;
  i int;
  c int;
  dbl int;
begin
  if length(d) not in (10,12) then
    return false;
  end if;

  -- always use last 10 for check-digit
  d := right(d, 10);

  -- simple Luhn for positions 1..9
  for i in 1..9 loop
    c := (substr(d, i, 1))::int;
    if (i % 2) = 1 then
      dbl := c*2; sum := sum + (dbl/10) + (dbl%10);
    else
      sum := sum + c;
    end if;
  end loop;

  return ((10 - (sum % 10)) % 10) = (substr(d,10,1))::int;
end
$$;

alter function public._pnr_normalize(text) owner to postgres;
alter function public.validate_swedish_pnr(text) owner to postgres;

-- Convert numeric/bigint PNR columns to text before adding generated columns/constraints
do $$
begin
  if to_regclass('public.car_images') is not null then
    begin
      execute 'alter table public.car_images alter column pnr_num type text using pnr_num::text';
    exception when undefined_column then
      -- column missing: ignore
      null;
    end;
  end if;

  if to_regclass('public.customers') is not null then
    begin
      execute 'alter table public.customers alter column pnr_num type text using pnr_num::text';
    exception when undefined_column then
      -- column missing: ignore
      null;
    end;
  end if;
end$$;

-- Add generated normalized columns (idempotent)
do $$
begin
  if to_regclass('public.auth_users') is not null then
    begin
      execute $$alter table public.auth_users
        add column if not exists pnr_num_norm text
        generated always as (public._pnr_normalize(pnr_num)) stored$$;
    exception when undefined_column then
      -- if pnr_num not present, skip
      null;
    end;
  end if;

  if to_regclass('public.customer_requests') is not null then
    begin
      execute $$alter table public.customer_requests
        add column if not exists pnr_num_norm text
        generated always as (public._pnr_normalize(pnr_num)) stored$$;
    exception when undefined_column then
      null;
    end;
  end if;

  if to_regclass('public.customers') is not null then
    begin
      execute $$alter table public.customers
        add column if not exists pnr_num_norm text
        generated always as (public._pnr_normalize(pnr_num)) stored$$;
    exception when undefined_column then
      null;
    end;
  end if;

  if to_regclass('public.car_images') is not null then
    begin
      execute $$alter table public.car_images
        add column if not exists pnr_num_norm text
        generated always as (public._pnr_normalize(pnr_num)) stored$$;
    exception when undefined_column then
      null;
    end;
  end if;
end$$;

-- Format checks (NOT VALID so historical rows won't block)
do $$
begin
  if to_regclass('public.auth_users') is not null then
    execute $$alter table public.auth_users
      drop constraint if exists auth_users_pnr_num_format,
      add constraint auth_users_pnr_num_format
      check (pnr_num is null or length(pnr_num_norm) in (10,12)) not valid$$;
  end if;

  if to_regclass('public.customer_requests') is not null then
    execute $$alter table public.customer_requests
      drop constraint if exists customer_requests_pnr_num_format,
      add constraint customer_requests_pnr_num_format
      check (pnr_num is null or length(pnr_num_norm) in (10,12)) not valid$$;
  end if;

  if to_regclass('public.customers') is not null then
    execute $$alter table public.customers
      drop constraint if exists customers_pnr_num_format,
      add constraint customers_pnr_num_format
      check (length(pnr_num_norm) in (10,12)) not valid$$;
  end if;

  if to_regclass('public.car_images') is not null then
    execute $$alter table public.car_images
      drop constraint if exists car_images_pnr_num_format,
      add constraint car_images_pnr_num_format
      check (length(pnr_num_norm) in (10,12)) not valid$$;
  end if;
end$$;

-- Create unique indexes on normalized PNR, only if no duplicates exist (to avoid migration failure)
do $$
declare dup_count int;
begin
  if to_regclass('public.customers') is not null then
    select count(*) into dup_count
    from (
      select pnr_num_norm
      from public.customers
      where pnr_num_norm is not null
      group by pnr_num_norm
      having count(*) > 1
    ) t;
    if coalesce(dup_count,0) = 0 then
      -- drop old unique on raw pnr if it exists
      begin
        execute 'alter table public.customers drop constraint if exists customers_pnr_num_key';
      exception when undefined_object then null;
      end;
      execute 'create unique index if not exists uq_customers_pnr_norm on public.customers(pnr_num_norm)';
    else
      raise notice 'Skipped creating uq_customers_pnr_norm due to duplicate normalized PNRs in customers';
    end if;
  end if;

  if to_regclass('public.car_images') is not null then
    select count(*) into dup_count
    from (
      select pnr_num_norm
      from public.car_images
      where pnr_num_norm is not null
      group by pnr_num_norm
      having count(*) > 1
    ) t;
    if coalesce(dup_count,0) = 0 then
      begin
        execute 'alter table public.car_images drop constraint if exists car_images_pnr_num_key';
      exception when undefined_object then null;
      end;
      execute 'create unique index if not exists uq_car_images_pnr_norm on public.car_images(pnr_num_norm)';
    else
      raise notice 'Skipped creating uq_car_images_pnr_norm due to duplicate normalized PNRs in car_images';
    end if;
  end if;
end$$;

-- 5) Tiny diagnostics / whoami
create or replace function public.whoami()
returns table(user_id uuid, role text, tenant_id bigint)
language sql
stable
as $$
  select auth.uid(), public.current_user_role(), public.current_user_tenant()
$$;

grant execute on function public.whoami() to authenticated, anon, service_role;

-- 6) Reload PostgREST
notify pgrst, 'reload schema';
