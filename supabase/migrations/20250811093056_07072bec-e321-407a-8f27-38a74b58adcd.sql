
-- 1) Normalizer: text -> enum (idempotent)
create or replace function public._driver_status_to_enum(p text)
returns public.driver_status
language sql immutable as $$
  select case lower(coalesce(p,'offline'))
           when 'available' then 'available'::public.driver_status
           when 'busy'      then 'busy'::public.driver_status
           when 'break'     then 'break'::public.driver_status
           when 'offline'   then 'offline'::public.driver_status
           -- legacy aliases
           when 'on_job'    then 'busy'::public.driver_status
           when 'on_break'  then 'break'::public.driver_status
           when 'rest'      then 'break'::public.driver_status
           when 'off_duty'  then 'offline'::public.driver_status
           when 'inactive'  then 'offline'::public.driver_status
           when 'on_duty'   then 'available'::public.driver_status
           else 'offline'::public.driver_status
         end;
$$;

-- 2) History table: add tenant_id, ensure timestamp default, backfill, indexes
alter table public.driver_status_history
  add column if not exists tenant_id bigint;

alter table public.driver_status_history
  alter column changed_at set default now();

update public.driver_status_history h
set tenant_id = d.tenant_id
from public.drivers d
where h.driver_id = d.id
  and h.tenant_id is null;

create index if not exists idx_dsh_tenant_id         on public.driver_status_history(tenant_id);
create index if not exists idx_dsh_driver_changed_at on public.driver_status_history(driver_id, changed_at desc);

-- 3) Replace self-RPC with fixed tenant type and full history insert
create or replace function public.update_driver_status(
  new_driver_status text,
  reason_param text default null
) returns jsonb
language plpgsql
security definer
set search_path = 'public, pg_temp'
as $$
declare
  v_user     uuid := auth.uid();
  v_driver   uuid;
  v_tenant   bigint;               -- tenant is BIGINT
  v_oldtxt   text;
  v_old      public.driver_status;
  v_new      public.driver_status;
  v_is_enum  boolean;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  -- Find current user's driver row and lock it
  select id, tenant_id, driver_status::text
    into v_driver, v_tenant, v_oldtxt
  from public.drivers
  where auth_user_id = v_user
  for update;

  if v_driver is null then
    raise exception 'Driver not found for current user';
  end if;

  -- Normalize text → enum
  v_new := public._driver_status_to_enum(new_driver_status);
  v_old := public._driver_status_to_enum(v_oldtxt);

  -- No change → short-circuit
  if v_old = v_new then
    return jsonb_build_object('success', true, 'driver_id', v_driver, 'new_status', v_new::text, 'no_change', true);
  end if;

  -- Update drivers (supports enum or text column)
  select (udt_name = 'driver_status') into v_is_enum
  from information_schema.columns
  where table_schema='public' and table_name='drivers' and column_name='driver_status';

  if v_is_enum then
    update public.drivers
       set driver_status = v_new,
           updated_at    = now()
     where id = v_driver;
  else
    update public.drivers
       set driver_status = v_new::text,
           updated_at    = now()
     where id = v_driver;
  end if;

  -- Insert history row with tenant, changed_by, source
  insert into public.driver_status_history
         (driver_id, old_status, new_status, changed_at, changed_by, source,       reason,       tenant_id)
  values (v_driver,  v_old,      v_new,      now(),      v_user,     'driver_app', reason_param, v_tenant);

  return jsonb_build_object('success', true, 'driver_id', v_driver, 'new_status', v_new::text);
end
$$;

-- 4) Tighten privileges and reload PostgREST schema cache
revoke execute on function public.update_driver_status(text, text) from anon;
grant  execute on function public.update_driver_status(text, text) to authenticated, service_role;

notify pgrst, 'reload schema';

-- 5) Optional guardrail while drivers.driver_status is TEXT: allow only canonical values
alter table public.drivers
  drop constraint if exists drivers_driver_status_check;

alter table public.drivers
  add constraint drivers_driver_status_check
  check (driver_status in ('available','busy','break','offline'));
