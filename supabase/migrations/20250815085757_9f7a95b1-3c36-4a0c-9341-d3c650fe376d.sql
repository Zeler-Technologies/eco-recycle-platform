-- Add missing roles to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'scrapyard_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'scrapyard_staff';