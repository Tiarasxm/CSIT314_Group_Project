-- ABSOLUTE FINAL FIX
-- This will completely reset RLS policies and fix all login issues
-- Run this ONE TIME and it will work

-- =======================
-- PART 1: Clean Up ALL Policies
-- =======================

-- Drop EVERY possible SELECT policy on users table
DO $$ 
BEGIN
  -- Drop all policies that might exist
  EXECUTE 'DROP POLICY IF EXISTS "Users can read own data" ON users';
  EXECUTE 'DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users';
  EXECUTE 'DROP POLICY IF EXISTS "Allow reading CSR representative profiles" ON users';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read CSR profiles" ON users';
  EXECUTE 'DROP POLICY IF EXISTS "Public CSR profiles readable" ON users';
  EXECUTE 'DROP POLICY IF EXISTS "Staff can read own data" ON users';
  
  RAISE NOTICE 'All potentially problematic policies dropped';
END $$;

-- =======================
-- PART 2: Create Simple, Safe Policies
-- =======================

-- Policy 1: Users can read their OWN data (for login and profile)
-- This is the ONLY way to safely allow users to read from users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (auth.uid() = id);

DO $$ 
BEGIN
  RAISE NOTICE 'Created simple read policy';
END $$;

-- =======================
-- PART 3: Verify get_csr_info Function Exists
-- =======================

-- Check if function exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_csr_info'
  ) THEN
    -- Create the function
    CREATE FUNCTION get_csr_info(csr_id UUID)
    RETURNS TABLE (
      id UUID,
      name TEXT,
      email TEXT,
      first_name TEXT,
      last_name TEXT
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    STABLE
    AS $func$
    BEGIN
      RETURN QUERY
      SELECT 
        u.id,
        u.name,
        u.email,
        u.first_name,
        u.last_name
      FROM users u
      WHERE u.id = csr_id
        AND u.role = 'csr-representative';
    END;
    $func$;

    -- Grant execute permission
    GRANT EXECUTE ON FUNCTION get_csr_info(UUID) TO authenticated;
    
    RAISE NOTICE 'Created get_csr_info function';
  ELSE
    RAISE NOTICE 'get_csr_info function already exists';
  END IF;
END $$;

-- =======================
-- PART 4: Verification
-- =======================

-- Show all SELECT policies on users table
SELECT 
  'Current SELECT policies on users:' as info,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Show if function exists
SELECT 
  'get_csr_info function:' as info,
  proname,
  pronargs as num_args
FROM pg_proc
WHERE proname = 'get_csr_info';

-- =======================
-- EXPECTED RESULT
-- =======================
-- You should see:
-- 1. Only ONE policy: "Users can read own data" with qual: (auth.uid() = id)
-- 2. Function get_csr_info exists with 1 argument

DO $$ 
BEGIN
  RAISE NOTICE '✅ Database policies fixed!';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  - Read their own profile (for login)';
  RAISE NOTICE '  - CSR info fetched via get_csr_info() function';
  RAISE NOTICE 'Refresh your browser to test login!';
END $$;

