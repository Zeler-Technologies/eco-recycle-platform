-- Step 1: Ensure enum exists and includes required values (no data changes)
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
END $$;