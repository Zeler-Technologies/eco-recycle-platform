
-- 0) Indexes (keep yours, add one more common filter)
create index if not exists idx_cars_tenant_id on public.cars(tenant_id);
create index if not exists idx_customers_car_id on public.customers(car_id);

-- 1) RLS: ensure SELECT works via cars.tenant_id
alter table public.cars enable row level security;
alter table public.customers enable row level security;

drop policy if exists cars_super_all on public.cars;
create policy cars_super_all
  on public.cars for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists cars_tenant_select on public.cars;
create policy cars_tenant_select
  on public.cars for select
  using (public.is_super_admin() or tenant_id = public.current_user_tenant());

drop policy if exists customers_super_all on public.customers;
create policy customers_super_all
  on public.customers for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists customers_tenant_select on public.customers;
create policy customers_tenant_select
  on public.customers for select
  using (
    exists (
      select 1
      from public.cars car
      where car.id = customers.car_id
        and (public.is_super_admin() or car.tenant_id = public.current_user_tenant())
    )
  );

-- 2) Safer view: normalize PNR inline, add security barrier, tighten grants
create or replace view public.v_tenant_customers as
with c_norm as (
  select
    c.*,
    nullif(regexp_replace(coalesce(c.pnr_num::text,''), '\D', '', 'g'),'') as pnr_norm
  from public.customers c
)
select
  c.id as customer_id,              -- corrected from c.customer_id
  car.tenant_id,
  c.scrapyard_id,
  c.car_id,
  car.license_plate,
  car.brand,
  car.model,
  c.name,
  c.phone,
  c.email,
  case
    when c.pnr_norm is null then null
    when length(c.pnr_norm) = 12 then left(c.pnr_norm, 8) || '-****'  -- YYYYMMDD-****
    when length(c.pnr_norm) = 10 then left(c.pnr_norm, 6) || '-****'  -- YYMMDD-****
    else null
  end as masked_pnr
from c_norm c
join public.cars car on car.id = c.car_id
where public.is_super_admin() or car.tenant_id = public.current_user_tenant();

-- make it a security-barrier view
alter view public.v_tenant_customers set (security_barrier = true);

-- tighten privileges
revoke all on public.v_tenant_customers from public, anon;
grant select on public.v_tenant_customers to authenticated;

-- refresh API cache
notify pgrst, 'reload schema';
