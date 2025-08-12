
-- 1) Canonical job view with scrapyard context (no data duplication)
create or replace view public.v_pickup_orders_enriched as
select
  po.*,
  cr.scrapyard_id
from public.pickup_orders po
join public.customer_requests cr on cr.id = po.customer_request_id;

grant select on public.v_pickup_orders_enriched to authenticated;

-- 2) Dates vs timestamps: add scheduled_at and gently backfill from scheduled_pickup_date if present
alter table public.pickup_orders
  add column if not exists scheduled_at timestamptz;

do $$
begin
  -- Backfill if scheduled_pickup_date exists; ignore if it doesn't
  begin
    update public.pickup_orders
      set scheduled_at = coalesce(scheduled_at, (scheduled_pickup_date)::timestamptz)
    where scheduled_at is null;
  exception when undefined_column then
    null;
  end;
end $$;

-- 3) driver_assignments integrity/idempotent columns
alter table public.driver_assignments
  add column if not exists status public.assignment_status default 'scheduled',
  add column if not exists is_active boolean default true,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

-- One active assignment per pickup (enforced only for “active” rows)
create unique index if not exists uq_active_assignment_per_pickup
  on public.driver_assignments(pickup_order_id)
  where coalesce(is_active, true)
    and completed_at is null
    and status not in (
      'completed'::public.assignment_status,
      'canceled'::public.assignment_status,
      'failed'::public.assignment_status
    );

-- Fast driver lookups
create index if not exists idx_da_driver on public.driver_assignments(driver_id);

-- 4) Optional performance helper: assigned_driver_id on pickup_orders + sync trigger
alter table public.pickup_orders
  add column if not exists assigned_driver_id uuid;

create or replace function public._sync_assigned_driver()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if tg_table_name = 'driver_assignments' then
    -- When row is active and not completed/canceled/failed -> set shortcut
    if (new.is_active is distinct from false)
       and new.completed_at is null
       and new.status not in (
         'completed'::public.assignment_status,
         'canceled'::public.assignment_status,
         'failed'::public.assignment_status
       )
       and new.pickup_order_id is not null then
      update public.pickup_orders
        set assigned_driver_id = new.driver_id
        where id = new.pickup_order_id;
    -- When previously active row becomes inactive/finished -> clear shortcut
    elsif (old is not null)
       and (old.is_active is distinct from false)
       and old.completed_at is null
       and old.status not in (
         'completed'::public.assignment_status,
         'canceled'::public.assignment_status,
         'failed'::public.assignment_status
       )
       and old.pickup_order_id is not null then
      update public.pickup_orders
        set assigned_driver_id = null
        where id = old.pickup_order_id
          and assigned_driver_id = old.driver_id;
    end if;
    return new;
  end if;
  return null;
end
$fn$;

drop trigger if exists trg_da_sync_assigned on public.driver_assignments;

create trigger trg_da_sync_assigned
  after insert or update of status, is_active, completed_at
  on public.driver_assignments
  for each row execute function public._sync_assigned_driver();

create index if not exists idx_po_assigned_driver on public.pickup_orders(assigned_driver_id);
