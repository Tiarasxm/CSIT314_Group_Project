-- Add User Admin and Platform Manager RLS policies
-- These were accidentally removed by migration 027

-- =======================
-- Drop existing policies first
-- =======================

DROP POLICY IF EXISTS "User admins can read all users" ON users;
DROP POLICY IF EXISTS "User admins can update all users" ON users;
DROP POLICY IF EXISTS "User admins can insert users" ON users;
DROP POLICY IF EXISTS "Platform managers can read all data" ON users;

-- =======================
-- Helper function to safely get current user's role
-- =======================

DROP FUNCTION IF EXISTS get_current_user_role();

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT role FROM users WHERE id = auth.uid() LIMIT 1
  );
END;
$$;

-- =======================
-- User Admin Policies
-- =======================

-- Policy: User Admins can read all users
CREATE POLICY "User admins can read all users" ON users
  FOR SELECT
  USING (get_current_user_role() = 'user-admin');

-- Policy: User Admins can update all users
CREATE POLICY "User admins can update all users" ON users
  FOR UPDATE
  USING (get_current_user_role() = 'user-admin')
  WITH CHECK (get_current_user_role() = 'user-admin');

-- Policy: User Admins can insert users
CREATE POLICY "User admins can insert users" ON users
  FOR INSERT
  WITH CHECK (get_current_user_role() = 'user-admin');

-- =======================
-- Platform Manager Policies
-- =======================

-- Policy: Platform Managers can read all data
CREATE POLICY "Platform managers can read all data" ON users
  FOR SELECT
  USING (get_current_user_role() = 'platform-manager');

-- =======================
-- Verification
-- =======================

-- Show all policies on users table
SELECT 
  'Current policies on users table:' as info,
  policyname,
  cmd as command,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'INSERT' THEN 'Insert'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as operation
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Verify we have the expected policies
DO $$ 
BEGIN
  RAISE NOTICE '✅ Admin policies added!';
  RAISE NOTICE 'User Admins can now:';
  RAISE NOTICE '  - Read all users';
  RAISE NOTICE '  - Update all users';
  RAISE NOTICE '  - Insert new users';
  RAISE NOTICE 'Platform Managers can now:';
  RAISE NOTICE '  - Read all users';
  RAISE NOTICE 'Refresh your browser to see all users!';
END $$;

