-- Remove the phone validation constraint that's blocking driver creation
ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS valid_phone;