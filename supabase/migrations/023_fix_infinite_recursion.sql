-- Fix infinite recursion in RLS policy
-- Problem: Migration 022 created a policy with "OR role = 'csr-representative'"
--          which may cause recursion in some Postgres configurations
-- Solution: Keep policies simple - only check auth.uid(), not row data

-- Drop ALL potentially problematic policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Allow reading CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Authenticated users can read CSR profiles" ON users;

-- Recreate the ORIGINAL simple policy from migration 005
-- This policy is SAFE and has been working without recursion
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- For CSR profile reading: Since we need users to see CSR names/emails,
-- we'll handle this at the APPLICATION level instead of RLS
-- The application code will fetch CSR details using a service role key
-- or we'll create a database FUNCTION to fetch CSR info safely

-- This avoids ALL recursion issues while maintaining security

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

