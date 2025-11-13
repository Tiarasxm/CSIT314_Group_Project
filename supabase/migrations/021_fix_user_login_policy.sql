-- Fix the RLS policy that broke user login
-- The previous policy was too broad and may have interfered with existing policies

-- First, drop the policy that may be causing issues
DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users;

-- Recreate with better logic that doesn't interfere with other policies
-- Allow users to read CSR reps (in addition to their own profile)
CREATE POLICY "Allow reading CSR representative profiles" ON users
  FOR SELECT
  USING (
    -- Users can always read their own profile (critical for login)
    auth.uid() = id
    OR
    -- OR users can read CSR representative profiles
    role = 'csr-representative'
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

