-- Add first_name and last_name columns to auth_users table
ALTER TABLE public.auth_users 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;