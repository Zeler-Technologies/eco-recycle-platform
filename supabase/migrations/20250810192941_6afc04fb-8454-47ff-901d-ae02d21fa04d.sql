-- Ensure driver_status enum includes canonical values and normalize data
DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('available');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'driver_status' AND e.enumlabel = 'off_duty') THEN
    ALTER TYPE driver_status ADD VALUE 'off_duty';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'driver_status' AND e.enumlabel = 'on_job') THEN
    ALTER TYPE driver_status ADD VALUE 'on_job';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'driver_status' AND e.enumlabel = 'inactive') THEN
    ALTER TYPE driver_status ADD VALUE 'inactive';
  END IF;
END $$;

-- Normalize legacy values to canonical set used by the app
-- Map on_job -> busy, inactive/off_duty -> offline
UPDATE public.drivers SET driver_status = 'busy'::driver_status WHERE driver_status = 'on_job'::driver_status;
UPDATE public.drivers SET driver_status = 'offline'::driver_status WHERE driver_status IN ('inactive'::driver_status, 'off_duty'::driver_status);

UPDATE public.driver_status_history SET new_status = 'busy'::driver_status WHERE new_status = 'on_job'::driver_status;
UPDATE public.driver_status_history SET new_status = 'offline'::driver_status WHERE new_status IN ('inactive'::driver_status, 'off_duty'::driver_status);
UPDATE public.driver_status_history SET old_status = 'busy'::driver_status WHERE old_status = 'on_job'::driver_status;
UPDATE public.driver_status_history SET old_status = 'offline'::driver_status WHERE old_status IN ('inactive'::driver_status, 'off_duty'::driver_status);
