-- Create Pre-Set Authority Accounts
-- Run this AFTER creating the auth users through Supabase Dashboard
-- 
-- Instructions:
-- 1. Go to Authentication → Users in Supabase Dashboard
-- 2. Create 3 users with the emails and passwords from PRE_SET_ACCOUNTS.md
-- 3. Note down the user IDs (UUIDs) from auth.users
-- 4. Update the INSERT statements below with the actual user IDs
-- 5. Run this migration

-- Example: Update user roles after creating auth users
-- Replace <platform_manager_user_id>, <user_admin_user_id>, <csr_rep_user_id> 
-- with actual UUIDs from auth.users table

-- Update Platform Manager role
UPDATE users 
SET 
  role = 'platform-manager',
  name = 'Platform Manager',
  first_name = 'Platform',
  last_name = 'Manager'
WHERE email = 'platform.manager@csr-platform.com';

-- Update User Admin role
UPDATE users 
SET 
  role = 'user-admin',
  name = 'User Administrator',
  first_name = 'User',
  last_name = 'Administrator'
WHERE email = 'user.admin@csr-platform.com';

-- Update CSR Representative role
UPDATE users 
SET 
  role = 'csr-representative',
  name = 'CSR Representative',
  first_name = 'CSR',
  last_name = 'Representative'
WHERE email = 'csr.representative@csr-platform.com';

-- Verify the accounts were created correctly
SELECT id, email, name, role, created_at 
FROM users 
WHERE email IN (
  'platform.manager@csr-platform.com',
  'user.admin@csr-platform.com',
  'csr.representative@csr-platform.com'
);

