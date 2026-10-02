-- ==============================================================================
-- Migration: 003_admin_users_schema.sql
-- Description: Team and User Management for inaquired Admin Console
-- ==============================================================================

-- 1. Create admin_users directory table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL DEFAULT '',
  role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'recruiter', 'editor')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255) DEFAULT 'system'
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users (email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users (role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users (status);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_at ON public.admin_users (created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DROP POLICY IF EXISTS "Authenticated users can view admin_users" ON public.admin_users;
CREATE POLICY "Authenticated users can view admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage admin_users" ON public.admin_users;
CREATE POLICY "Authenticated users can manage admin_users"
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon view admin_users" ON public.admin_users;
CREATE POLICY "Allow anon view admin_users"
  ON public.admin_users
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon manage admin_users" ON public.admin_users;
CREATE POLICY "Allow anon manage admin_users"
  ON public.admin_users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 4. Sync existing auth.users into public.admin_users
INSERT INTO public.admin_users (id, email, full_name, role, status, created_at, updated_at)
SELECT 
  id, 
  LOWER(email), 
  COALESCE(raw_user_meta_data->>'full_name', 'Primary Administrator'),
  COALESCE(raw_user_meta_data->>'role', 'superadmin'),
  'active',
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, updated_at = NOW();

-- 5. Stored Procedure: Admin Create User (writes to auth.users, auth.identities & public.admin_users)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'admin'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID := gen_random_uuid();
  enc_pw TEXT;
  clean_email TEXT := LOWER(TRIM(p_email));
  clean_name TEXT := TRIM(p_full_name);
  clean_role TEXT := TRIM(p_role);
BEGIN
  -- Validate Role
  IF clean_role NOT IN ('superadmin', 'admin', 'recruiter', 'editor') THEN
    clean_role := 'admin';
  END IF;

  -- Check if email exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = clean_email) THEN
    RAISE EXCEPTION 'A user with email % already exists.', clean_email;
  END IF;

  -- Hash password using pgcrypto
  enc_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Insert into Supabase Auth users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_id,
    'authenticated',
    'authenticated',
    clean_email,
    enc_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('role', clean_role, 'full_name', clean_name),
    NOW(),
    NOW(),
    '',
    ''
  );

  -- Insert into Supabase Auth identities
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_id,
    new_id,
    new_id::text,
    jsonb_build_object('sub', new_id::text, 'email', clean_email),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Insert into public.admin_users
  INSERT INTO public.admin_users (
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    new_id,
    clean_email,
    clean_name,
    clean_role,
    'active',
    NOW(),
    NOW()
  );

  RETURN jsonb_build_object(
    'id', new_id,
    'email', clean_email,
    'full_name', clean_name,
    'role', clean_role,
    'status', 'active'
  );
END;
$$;

-- 6. Stored Procedure: Admin Update User
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_name TEXT := TRIM(p_full_name);
  clean_role TEXT := TRIM(p_role);
  clean_status TEXT := TRIM(p_status);
BEGIN
  -- Update public.admin_users
  UPDATE public.admin_users
  SET full_name = COALESCE(clean_name, full_name),
      role = COALESCE(clean_role, role),
      status = COALESCE(clean_status, status),
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Update auth.users metadata and password if supplied
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || 
        jsonb_build_object(
          'role', COALESCE(clean_role, raw_user_meta_data->>'role'),
          'full_name', COALESCE(clean_name, raw_user_meta_data->>'full_name')
        ),
      encrypted_password = CASE 
        WHEN p_password IS NOT NULL AND length(trim(p_password)) >= 6 
        THEN extensions.crypt(trim(p_password), extensions.gen_salt('bf')) 
        ELSE encrypted_password 
      END,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- 7. Stored Procedure: Admin Delete User
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.admin_users WHERE id = p_user_id;
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN true;
END;
$$;

-- 8. Grant Execution Permissions
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated, anon, service_role;
