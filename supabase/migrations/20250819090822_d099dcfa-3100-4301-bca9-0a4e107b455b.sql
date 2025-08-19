-- Add unique constraint for pnr_num to prevent duplicates
ALTER TABLE public.auth_users ADD CONSTRAINT unique_pnr_num UNIQUE (pnr_num);

-- Add index for better performance on pnr_num lookups
CREATE INDEX IF NOT EXISTS idx_auth_users_pnr_num ON public.auth_users(pnr_num) WHERE pnr_num IS NOT NULL;