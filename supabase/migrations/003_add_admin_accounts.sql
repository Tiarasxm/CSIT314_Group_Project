-- Add Admin Accounts to Users Table
-- Run this AFTER running 001_initial_schema.sql
-- This script will add the pre-created admin accounts to the users table

DO $$
DECLARE
  platform_manager_id UUID;
  user_admin_id UUID;
  csr_rep_id UUID;
BEGIN
  -- Get user IDs from auth.users
  SELECT id INTO platform_manager_id 
  FROM auth.users 
  WHERE email = 'platform.manager@csr-platform.com';
  
  SELECT id INTO user_admin_id 
  FROM auth.users 
  WHERE email = 'user.admin@csr-platform.com';
  
  SELECT id INTO csr_rep_id 
  FROM auth.users 
  WHERE email = 'csr.representative@csr-platform.com';

  -- Check if IDs were found
  IF platform_manager_id IS NULL THEN
    RAISE EXCEPTION 'Platform Manager account not found in auth.users. Run the create-admin-accounts script first.';
  END IF;
  
  IF user_admin_id IS NULL THEN
    RAISE EXCEPTION 'User Admin account not found in auth.users. Run the create-admin-accounts script first.';
  END IF;
  
  IF csr_rep_id IS NULL THEN
    RAISE EXCEPTION 'CSR Representative account not found in auth.users. Run the create-admin-accounts script first.';
  END IF;

  -- Insert or update users in users table
  INSERT INTO users (id, email, name, first_name, last_name, role)
  VALUES 
    (platform_manager_id, 'platform.manager@csr-platform.com', 'Platform Manager', 'Platform', 'Manager', 'platform-manager'),
    (user_admin_id, 'user.admin@csr-platform.com', 'User Administrator', 'User', 'Administrator', 'user-admin'),
    (csr_rep_id, 'csr.representative@csr-platform.com', 'CSR Representative', 'CSR', 'Representative', 'csr-representative')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;
    
  -- Also update auth.users metadata to include role (helps with RLS policies)
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb('platform-manager'::text)
  )
  WHERE id = platform_manager_id;
  
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb('user-admin'::text)
  )
  WHERE id = user_admin_id;
  
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb('csr-representative'::text)
  )
  WHERE id = csr_rep_id;
    
  RAISE NOTICE '✅ Admin accounts added to users table successfully!';
  RAISE NOTICE '   - Platform Manager: %', platform_manager_id;
  RAISE NOTICE '   - User Admin: %', user_admin_id;
  RAISE NOTICE '   - CSR Representative: %', csr_rep_id;
END $$;

-- Verify the accounts were added
SELECT 
  u.email,
  u.name,
  u.role,
  CASE WHEN au.email_confirmed_at IS NOT NULL THEN 'Confirmed' ELSE 'Not Confirmed' END as email_status
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.email IN (
  'platform.manager@csr-platform.com',
  'user.admin@csr-platform.com',
  'csr.representative@csr-platform.com'
)
ORDER BY 
  CASE u.role
    WHEN 'platform-manager' THEN 1
    WHEN 'user-admin' THEN 2
    WHEN 'csr-representative' THEN 3
  END;

