-- Clean fix for RLS policies - remove all conflicting policies and start fresh
-- This resolves the 500 error and login issues

-- Step 1: Remove the problematic policies we added
DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Allow reading CSR representative profiles" ON users;

-- Step 2: Drop and recreate the main "Users can read own data" policy
-- to include CSR reading capability
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Step 3: Create a single clean policy that allows:
-- 1. Users to read their own data (for login)
-- 2. Users to read CSR representative profiles (for displaying CSR info)
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (
    -- Users can always read their own profile
    auth.uid() = id
    OR
    -- Users can also read CSR representative profiles
    role = 'csr-representative'
  );

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
  AND policyname = 'Users can read own data';

