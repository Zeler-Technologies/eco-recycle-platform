-- Remove the email validation constraint that's blocking driver creation
ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS valid_email;