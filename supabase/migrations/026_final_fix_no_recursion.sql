-- FINAL FIX: Remove ALL policies that check role column
-- ANY policy checking "role = 'something'" causes infinite recursion
-- Solution: Keep ONLY the simple auth.uid() policy

-- Drop EVERYTHING that could be causing recursion
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Allow reading CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Authenticated users can read CSR profiles" ON users;
DROP POLICY IF EXISTS "Public CSR profiles readable" ON users;

-- Create ONLY the simple, safe policy
-- This is the ORIGINAL policy from migration 005 that worked
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- DO NOT add any policy that checks the role column!
-- For CSR info, we MUST use the get_csr_info() function

-- Verify only ONE SELECT policy exists
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Should show ONLY "Users can read own data"

