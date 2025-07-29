-- Drop existing functions to recreate with proper signatures
DROP FUNCTION IF EXISTS public.create_tenant_complete(text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.assign_tenant_admin_role(uuid, bigint);
DROP FUNCTION IF EXISTS public.generate_secure_password();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Create or ensure user_role enum exists
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('super_admin', 'tenant_admin', 'scrapyard_admin', 'scrapyard_staff', 'driver', 'customer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure password generation function
CREATE OR REPLACE FUNCTION public.generate_secure_password()
RETURNS TEXT AS $$
DECLARE
  password TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  i INTEGER;
BEGIN
  password := '';
  FOR i IN 1..12 LOOP
    password := password || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create tenants table if not exists
CREATE TABLE IF NOT EXISTS public.tenants (
  tenants_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  service_type TEXT,
  base_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  scrapyard_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role, scrapyard_id)
);

-- Add updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at ON public.tenants;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.scrapyards;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.scrapyards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.user_roles;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.auth_users;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.auth_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create tenant creation function with p_ prefixed parameters
CREATE OR REPLACE FUNCTION public.create_tenant_complete(
  p_name TEXT,
  p_country TEXT,
  p_admin_name TEXT,
  p_admin_email TEXT,
  p_service_type TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id BIGINT;
  v_scrapyard_id BIGINT;
  v_generated_password TEXT;
  v_result JSONB;
BEGIN
  -- Check if user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) AND role = 'super_admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only super admins can create tenants'
    );
  END IF;

  -- Check for duplicate tenant name
  IF EXISTS (SELECT 1 FROM public.tenants WHERE name = p_name) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tenant with this name already exists'
    );
  END IF;

  -- Generate a random password
  v_generated_password := public.generate_secure_password();
  
  -- Create the tenant
  INSERT INTO public.tenants (name, country, service_type, base_address)
  VALUES (p_name, p_country, p_service_type, p_address)
  RETURNING tenants_id INTO v_tenant_id;
  
  -- Create the scrapyard
  INSERT INTO public.scrapyards (name, address, postal_code, city, tenant_id)
  VALUES (p_name, p_address, p_postal_code, p_city, v_tenant_id)
  RETURNING id INTO v_scrapyard_id;
  
  -- Return the result
  v_result := jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'scrapyard_id', v_scrapyard_id,
    'admin_name', p_admin_name,
    'admin_email', p_admin_email,
    'generated_password', v_generated_password
  );
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create role assignment function with p_ prefixed parameters
CREATE OR REPLACE FUNCTION public.assign_tenant_admin_role(
  p_user_id UUID,
  p_tenant_id BIGINT
)
RETURNS VOID AS $$
BEGIN
  -- Update the auth_users record
  UPDATE public.auth_users
  SET tenant_id = p_tenant_id,
      role = 'tenant_admin'
  WHERE id = p_user_id;
  
  -- Create a user_role record
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'tenant_admin')
  ON CONFLICT (user_id, role, scrapyard_id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error assigning tenant admin role: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrapyards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can see all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenant admins can see their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Only super admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Only super admins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Only super admins can delete tenants" ON public.tenants;

-- Create tenant table policies
CREATE POLICY "Super admins can see all tenants" 
ON public.tenants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Tenant admins can see their own tenant" 
ON public.tenants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.auth_users 
    WHERE id = (auth.uid()) 
    AND tenant_id = tenants.tenants_id
  )
);

CREATE POLICY "Only super admins can insert tenants" 
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Only super admins can update tenants" 
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Only super admins can delete tenants" 
ON public.tenants
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) 
    AND role = 'super_admin'
  )
);

-- Drop existing scrapyard policies
DROP POLICY IF EXISTS "Super admins can see all scrapyards" ON public.scrapyards;
DROP POLICY IF EXISTS "Users can see scrapyards they have access to" ON public.scrapyards;
DROP POLICY IF EXISTS "Allow everyone to view active scrapyards" ON public.scrapyards;
DROP POLICY IF EXISTS "Only super admins and tenant admins can insert scrapyards" ON public.scrapyards;

-- Create scrapyard table policies
CREATE POLICY "Super admins can see all scrapyards" 
ON public.scrapyards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Users can see scrapyards they have access to" 
ON public.scrapyards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.auth_users 
    WHERE id = (auth.uid()) 
    AND tenant_id = scrapyards.tenant_id
  )
);

CREATE POLICY "Allow everyone to view active scrapyards" 
ON public.scrapyards 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only super admins and tenant admins can insert scrapyards" 
ON public.scrapyards
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) 
    AND (role = 'super_admin' OR role = 'tenant_admin')
  )
);

-- Drop existing user_roles policies
DROP POLICY IF EXISTS "Super admins can see all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can see their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Tenant admins can see roles for their tenant" ON public.user_roles;

-- Create user_roles table policies  
CREATE POLICY "Super admins can see all user roles" 
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = (auth.uid()) 
    AND ur2.role = 'super_admin'
  )
);

CREATE POLICY "Users can see their own roles" 
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = (auth.uid()));

CREATE POLICY "Only super admins can manage user roles" 
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = (auth.uid()) 
    AND ur2.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = (auth.uid()) 
    AND ur2.role = 'super_admin'
  )
);

-- Drop existing auth_users policies
DROP POLICY IF EXISTS "Super admins can see all auth users" ON public.auth_users;
DROP POLICY IF EXISTS "Users can see their own auth user record" ON public.auth_users;
DROP POLICY IF EXISTS "Tenant admins can see auth users for their tenant" ON public.auth_users;

-- Create auth_users table policies
CREATE POLICY "Super admins can see all auth users" 
ON public.auth_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Users can see their own auth user record" 
ON public.auth_users
FOR SELECT
TO authenticated
USING (id = (auth.uid()));

CREATE POLICY "Tenant admins can see auth users for their tenant" 
ON public.auth_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.auth_users au
    WHERE au.id = (auth.uid())
    AND au.role = 'tenant_admin'
    AND au.tenant_id = auth_users.tenant_id
  )
);

CREATE POLICY "Super admins can manage all auth users" 
ON public.auth_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (auth.uid()) 
    AND role = 'super_admin'
  )
);