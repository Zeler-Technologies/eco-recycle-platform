-- =========================================
-- 1) Fix status mapping to the canonical four
-- =========================================
-- Replace helper so it returns ONLY: available|busy|break|offline
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
           when 'in_progress' then 'busy'::public.driver_status
           when 'on_break'  then 'break'::public.driver_status
           when 'rest'      then 'break'::public.driver_status
           when 'off_duty'  then 'offline'::public.driver_status
           when 'inactive'  then 'offline'::public.driver_status
           when 'on_duty'   then 'available'::public.driver_status
           else 'offline'::public.driver_status
         end;
$$;

-- Recreate the drivers sync trigger to use the corrected helper
create or replace function public._sync_drivers_status()
returns trigger language plpgsql as $$
begin
  new.status := public._driver_status_to_enum(new.driver_status);
  return new;
end$$;

drop trigger if exists trg_sync_drivers_status on public.drivers;
create trigger trg_sync_drivers_status
before insert or update of driver_status
on public.drivers
for each row execute function public._sync_drivers_status();

-- =========================================
-- 2) PNR uniqueness on normalized value
--    (run audits; only enforce if no collisions)
-- =========================================

-- Audit duplicates by normalized value (report if any rows returned)
-- select pnr_num_norm, count(*) from public.customers   group by 1 having count(*) > 1;
-- select pnr_num_norm, count(*) from public.car_images group by 1 having count(*) > 1;

-- If audits return zero rows, switch uniqueness to normalized value:
alter table public.customers drop constraint if exists customers_pnr_num_key;
create unique index if not exists uq_customers_pnr_norm on public.customers(pnr_num_norm);

alter table public.car_images drop constraint if exists car_images_pnr_num_key;
create unique index if not exists uq_car_images_pnr_norm on public.car_images(pnr_num_norm);

-- =========================================
-- 3) Drop duplicate driver_locations index (keep one on (driver_id, recorded_at))
-- =========================================
do $$
begin
  -- Drop either name if both point to the same key; no-op if only one exists
  if exists (select 1 from pg_indexes where schemaname='public' and indexname='dl_last_seen_idx')
     and exists (select 1 from pg_indexes where schemaname='public' and indexname='idx_driver_locations_driver_id') then
    -- Keep idx_driver_locations_driver_id, drop the other
    execute 'drop index if exists public.dl_last_seen_idx';
  end if;
end$$;

-- =========================================
-- 4) (Optional) composite index for tenant roster
-- =========================================
-- create index if not exists idx_drivers_tenant_status on public.drivers(tenant_id, driver_status);

-- =========================================
-- 5) Validate PNR constraints later after QA (separate migration)
-- =========================================
-- alter table public.auth_users         validate constraint auth_users_pnr_num_format;
-- alter table public.customer_requests  validate constraint customer_requests_pnr_num_format;
-- alter table public.customers          validate constraint customers_pnr_num_format;
-- alter table public.car_images         validate constraint car_images_pnr_num_format;

-- =========================================
-- 6) Reload API schema cache
-- =========================================
notify pgrst, 'reload schema';