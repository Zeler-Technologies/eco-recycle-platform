-- Align driver availability statuses across DB (v2)
-- 1) Ensure enum exists and includes required values
DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('available');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add missing enum values conditionally
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'driver_status' AND e.enumlabel = 'busy') THEN
    ALTER TYPE driver_status ADD VALUE 'busy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'driver_status' AND e.enumlabel = 'break') THEN
    ALTER TYPE driver_status ADD VALUE 'break';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'driver_status' AND e.enumlabel = 'offline') THEN
    ALTER TYPE driver_status ADD VALUE 'offline';
  END IF;
END $$;

-- 2) Normalize legacy values if any exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='drivers' AND column_name='driver_status')
  THEN
    UPDATE public.drivers 
      SET driver_status = 'offline'::driver_status
    WHERE (driver_status)::text IN ('off_duty','inactive');

    UPDATE public.drivers 
      SET driver_status = 'break'::driver_status
    WHERE (driver_status)::text IN ('on_break','rest');
  END IF;
END $$;

-- 3) Convert driver_status_history.old_status/new_status to enum if still text
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='driver_status_history' AND column_name='new_status' AND data_type <> 'USER-DEFINED')
  THEN
    -- Pre-normalize any legacy text values
    UPDATE public.driver_status_history SET new_status = 'offline' WHERE new_status IN ('off_duty','inactive');
    UPDATE public.driver_status_history SET new_status = 'break'   WHERE new_status IN ('on_break','rest');

    ALTER TABLE public.driver_status_history
      ALTER COLUMN new_status TYPE driver_status USING new_status::driver_status;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='driver_status_history' AND column_name='old_status' AND data_type <> 'USER-DEFINED')
  THEN
    UPDATE public.driver_status_history SET old_status = 'offline' WHERE old_status IN ('off_duty','inactive');
    UPDATE public.driver_status_history SET old_status = 'break'   WHERE old_status IN ('on_break','rest');

    ALTER TABLE public.driver_status_history
      ALTER COLUMN old_status TYPE driver_status USING old_status::driver_status;
  END IF;
END $$;