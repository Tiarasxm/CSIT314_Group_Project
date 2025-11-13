-- Simplest possible approach: Two separate policies with NO overlap
-- This absolutely cannot cause recursion

-- Policy 1: Users read their own data (for login)
-- Already exists from migration 023, but let's ensure it's correct
DROP POLICY IF EXISTS "Users can read own data" ON users;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Allow reading CSR representative profiles
-- This is PERMISSIVE (default) so it OR's with other policies
-- It only checks the ROW data (role column), NOT the current user
-- This should NOT cause recursion
CREATE POLICY "Public CSR profiles readable" ON users
  FOR SELECT
  USING (
    role = 'csr-representative'  -- Just checking the row's role column
  );

-- These two policies will OR together:
-- A user can read a row IF (they own it) OR (it's a CSR profile)

-- Verify
SELECT 
  policyname,
  cmd,
  permissive,
  qual
FROM pg_policies
WHERE tablename = 'users'
  AND cmd = 'SELECT'
ORDER BY policyname;

