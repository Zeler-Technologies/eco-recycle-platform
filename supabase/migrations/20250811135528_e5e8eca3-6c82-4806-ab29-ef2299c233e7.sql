-- Use portable regex: strip non-digits with '[^0-9]' everywhere

-- 1) Ensure ALL normalized columns exist (auth_users, customer_requests, customers, car_images)
alter table public.auth_users
  add column if not exists pnr_num_norm text
  generated always as (regexp_replace(coalesce(pnr_num,''), '[^0-9]', '', 'g')) stored;

alter table public.customer_requests
  add column if not exists pnr_num_norm text
  generated always as (regexp_replace(coalesce(pnr_num,''), '[^0-9]', '', 'g')) stored;

-- Ensure normalized columns also exist for customers and car_images (cast numeric/bigint to text)
alter table public.customers
  add column if not exists pnr_num_norm text
  generated always as (regexp_replace(coalesce(pnr_num::text,''), '[^0-9]', '', 'g')) stored;

alter table public.car_images
  add column if not exists pnr_num_norm text
  generated always as (regexp_replace(coalesce(pnr_num::text,''), '[^0-9]', '', 'g')) stored;

-- 2) Recreate/ensure NOT VALID format checks (10 or 12 digits) across all four tables
do $$
begin
  execute $c$alter table public.auth_users
    drop constraint if exists auth_users_pnr_num_format;
    alter table public.auth_users
    add  constraint auth_users_pnr_num_format
    check (pnr_num_norm ~ '^[0-9]{10}$' or pnr_num_norm ~ '^[0-9]{12}$') not valid$c$;

  execute $c$alter table public.customer_requests
    drop constraint if exists customer_requests_pnr_num_format;
    alter table public.customer_requests
    add  constraint customer_requests_pnr_num_format
    check (pnr_num_norm ~ '^[0-9]{10}$' or pnr_num_norm ~ '^[0-9]{12}$') not valid$c$;

  execute $c$alter table public.customers
    drop constraint if exists customers_pnr_num_format;
    alter table public.customers
    add  constraint customers_pnr_num_format
    check (pnr_num_norm ~ '^[0-9]{10}$' or pnr_num_norm ~ '^[0-9]{12}$') not valid$c$;

  execute $c$alter table public.car_images
    drop constraint if exists car_images_pnr_num_format;
    alter table public.car_images
    add  constraint car_images_pnr_num_format
    check (pnr_num_norm ~ '^[0-9]{10}$' or pnr_num_norm ~ '^[0-9]{12}$') not valid$c$;
end$$;

-- 5) Make sure the corrected status mapper is in place (already added earlier), then reload schema:
notify pgrst, 'reload schema';