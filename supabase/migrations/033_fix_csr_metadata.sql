-- Fix CSR account metadata to ensure role is set in raw_user_meta_data
-- This ensures CSR login works without querying the users table

DO $$
BEGIN
  -- Update all CSR representative accounts to have role in metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb('csr-representative'::text)
  )
  WHERE email IN (
    'csr.representative@csr-platform.com',
    'csr@csr-platform.com',
    'csr2@csr-platform.com',
    'csr3@csr-platform.com',
    'csr4@csr-platform.com'
  );

  -- Also update Platform Manager
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb('platform-manager'::text)
  )
  WHERE email IN (
    'platform.manager@csr-platform.com',
    'manager@csr-platform.com'
  );

  -- Also update User Admin
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb('user-admin'::text)
  )
  WHERE email IN (
    'user.admin@csr-platform.com',
    'admin@csr-platform.com'
  );

  RAISE NOTICE '✅ All staff account metadata updated with roles';
END $$;

-- Verify the metadata is set correctly
SELECT 
  email,
  raw_user_meta_data->>'role' as role_in_metadata,
  raw_user_meta_data->>'name' as name_in_metadata
FROM auth.users
WHERE email IN (
  'csr.representative@csr-platform.com',
  'csr@csr-platform.com',
  'csr2@csr-platform.com',
  'csr3@csr-platform.com',
  'csr4@csr-platform.com',
  'platform.manager@csr-platform.com',
  'manager@csr-platform.com',
  'user.admin@csr-platform.com',
  'admin@csr-platform.com'
)
ORDER BY email;

