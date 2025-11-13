-- COMPREHENSIVE AUTHENTICATION DIAGNOSTIC
-- Run this to get a complete picture of what's different

-- 1. Check auth.users passwords (should all be identical length/format)
SELECT 
  email,
  length(encrypted_password) as pwd_len,
  left(encrypted_password, 7) as pwd_prefix,
  email_confirmed_at IS NOT NULL as confirmed,
  banned_until,
  confirmation_sent_at
FROM auth.users
WHERE email IN (
  'csr.representative@csr-platform.com',
  'csr2@csr-platform.com',
  'csr3@csr-platform.com',
  'csr4@csr-platform.com'
)
ORDER BY email;

-- 2. Check public.users (focus on is_suspended and role)
SELECT 
  email,
  role,
  is_suspended,
  created_at,
  updated_at
FROM users
WHERE email IN (
  'csr.representative@csr-platform.com',
  'csr2@csr-platform.com',
  'csr3@csr-platform.com',
  'csr4@csr-platform.com'
)
ORDER BY email;

-- 3. Check for any auth hooks or policies on auth schema
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'auth';

-- 4. Test if get_current_user_role works for each account
-- (This requires actually being logged in as each user, so skip for now)

-- 5. Check if there are any constraints or rules on users table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass;

