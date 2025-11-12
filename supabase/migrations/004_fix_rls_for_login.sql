-- Fix RLS policies to allow users to read their own data for login
-- This ensures staff can read their own user record to check their role

-- Drop and recreate the "Users can read own data" policy to ensure it works
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create a policy that allows any authenticated user to read their own record
-- This is essential for login checks
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Also ensure staff roles can read their own data (redundant but explicit)
-- This helps with the login flow
DROP POLICY IF EXISTS "Staff can read own data" ON users;

CREATE POLICY "Staff can read own data" ON users
  FOR SELECT 
  USING (
    auth.uid() = id AND
    role IN ('platform-manager', 'user-admin', 'csr-representative')
  );

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

