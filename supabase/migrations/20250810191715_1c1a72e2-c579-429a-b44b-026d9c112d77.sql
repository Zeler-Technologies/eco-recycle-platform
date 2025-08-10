-- Align driver availability statuses across DB
-- 1) Ensure enum exists
DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('available','busy','break','offline');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Normalize legacy values if any exist
-- Drivers table: convert legacy text/enums to canonical values
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='drivers' AND column_name='driver_status')
  THEN
    -- If column is enum, compare via ::text; if text, ::text is a no-op
    UPDATE public.drivers 
      SET driver_status = 'offline'::driver_status
    WHERE (driver_status)::text IN ('off_duty','inactive');

    UPDATE public.drivers 
      SET driver_status = 'break'::driver_status
    WHERE (driver_status)::text IN ('on_break','rest');
  END IF;
END $$;

-- History table: normalize text values
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='driver_status_history' AND column_name='new_status')
  THEN
    UPDATE public.driver_status_history SET new_status = 'offline' WHERE new_status IN ('off_duty','inactive');
    UPDATE public.driver_status_history SET new_status = 'break'   WHERE new_status IN ('on_break','rest');
  END IF;
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='driver_status_history' AND column_name='old_status')
  THEN
    UPDATE public.driver_status_history SET old_status = 'offline' WHERE old_status IN ('off_duty','inactive');
    UPDATE public.driver_status_history SET old_status = 'break'   WHERE old_status IN ('on_break','rest');
  END IF;
END $$;

-- 3) Convert driver_status_history.old_status/new_status to enum
DO $$ BEGIN
  -- Only alter if columns exist and are not already of enum type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='driver_status_history' AND column_name='new_status' AND data_type <> 'USER-DEFINED')
  THEN
    ALTER TABLE public.driver_status_history
      ALTER COLUMN new_status TYPE driver_status USING new_status::driver_status;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='driver_status_history' AND column_name='old_status' AND data_type <> 'USER-DEFINED')
  THEN
    ALTER TABLE public.driver_status_history
      ALTER COLUMN old_status TYPE driver_status USING old_status::driver_status;
  END IF;
END $$;