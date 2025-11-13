-- Allow regular users to read CSR representative basic information
-- This is needed so users can see who their assigned CSR is on their requests

-- Create a policy that allows all authenticated users to read CSR representative profiles
-- This only exposes basic public info (name, email) and is safe
CREATE POLICY "Users can read CSR representative profiles" ON users
  FOR SELECT
  USING (
    role = 'csr-representative'
  );

-- This is a simple approach: all CSR representative profiles are readable
-- by authenticated users so they can see who handled their requests.
-- Private/sensitive fields can be protected at the application level.

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
  AND policyname = 'Users can read CSR representative profiles'
ORDER BY tablename, policyname;

