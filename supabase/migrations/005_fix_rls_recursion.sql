-- Fix RLS infinite recursion issue
-- Problem: Policies checking roles by querying users table create circular dependencies
-- Solution: Use auth.users metadata instead of querying users table

-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "User admins can read all users" ON users;
DROP POLICY IF EXISTS "User admins can update all users" ON users;
DROP POLICY IF EXISTS "User admins can insert users" ON users;
DROP POLICY IF EXISTS "Platform managers can read all data" ON users;
DROP POLICY IF EXISTS "Staff can read own data" ON users;

-- CRITICAL: Users must be able to read their own data for login checks
-- This has NO circular dependency - only checks auth.uid()
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a SECURITY DEFINER function to check user role
-- This bypasses RLS and avoids recursion by reading directly from users table
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Read from users table directly (bypasses RLS due to SECURITY DEFINER)
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- User Admins can read all users
-- Uses the function to check role from auth.users (no recursion)
CREATE POLICY "User admins can read all users" ON users
  FOR SELECT 
  USING (get_user_role(auth.uid()) = 'user-admin');

-- User Admins can update all users
CREATE POLICY "User admins can update all users" ON users
  FOR UPDATE 
  USING (get_user_role(auth.uid()) = 'user-admin');

-- User Admins can insert users
CREATE POLICY "User admins can insert users" ON users
  FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) = 'user-admin');

-- Platform Managers can read all data
CREATE POLICY "Platform managers can read all data" ON users
  FOR SELECT 
  USING (get_user_role(auth.uid()) = 'platform-manager');

-- Fix requests table policies that also have recursion issues
DROP POLICY IF EXISTS "CSR reps can read pending requests" ON requests;
DROP POLICY IF EXISTS "CSR reps can read accepted requests" ON requests;
DROP POLICY IF EXISTS "CSR reps can update accepted requests" ON requests;
DROP POLICY IF EXISTS "Platform managers can read all requests" ON requests;

-- CSR Representatives can read all pending requests
CREATE POLICY "CSR reps can read pending requests" ON requests
  FOR SELECT 
  USING (
    status = 'pending' AND
    get_user_role(auth.uid()) = 'csr-representative'
  );

-- CSR Representatives can read requests they accepted
CREATE POLICY "CSR reps can read accepted requests" ON requests
  FOR SELECT 
  USING (
    accepted_by = auth.uid() AND
    get_user_role(auth.uid()) = 'csr-representative'
  );

-- CSR Representatives can update requests they accept
CREATE POLICY "CSR reps can update accepted requests" ON requests
  FOR UPDATE 
  USING (get_user_role(auth.uid()) = 'csr-representative');

-- Platform Managers can read all requests
CREATE POLICY "Platform managers can read all requests" ON requests
  FOR SELECT 
  USING (get_user_role(auth.uid()) = 'platform-manager');

-- Verify all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'requests')
ORDER BY tablename, policyname;
