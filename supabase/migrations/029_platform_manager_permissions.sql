-- Platform Manager Permissions
-- This migration adds RLS policies for platform managers to:
-- 1. View all service requests
-- 2. View user counts for dashboard stats

-- Note: Announcements table and its policies are created in 028_create_announcements_table.sql

-- =============================================
-- PART 1: Platform Manager can view all requests
-- =============================================

-- Drop policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Platform Managers can view all requests" ON requests;

-- Platform managers need to view all requests from all users
CREATE POLICY "Platform Managers can view all requests" ON requests
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'platform-manager'
    )
  );

-- =============================================
-- PART 2: Platform Manager can view user stats
-- =============================================

-- Platform managers need to count users for dashboard stats
CREATE OR REPLACE FUNCTION get_user_counts()
RETURNS TABLE (
  total_users BIGINT,
  total_csrs BIGINT,
  total_user_admins BIGINT,
  total_platform_managers BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow platform managers to call this
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'platform-manager'
  ) THEN
    RAISE EXCEPTION 'Only platform managers can view user counts';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE role = 'user') AS total_users,
    COUNT(*) FILTER (WHERE role = 'csr-representative') AS total_csrs,
    COUNT(*) FILTER (WHERE role = 'user-admin') AS total_user_admins,
    COUNT(*) FILTER (WHERE role = 'platform-manager') AS total_platform_managers
  FROM users;
END;
$$;

-- =============================================
-- Verification
-- =============================================

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('requests', 'announcements')
  AND policyname LIKE '%Platform Manager%'
ORDER BY tablename, policyname;

-- Verify function exists
SELECT 
  proname as function_name,
  pronargs as num_args
FROM pg_proc
WHERE proname = 'get_user_counts';

-- ✅ Expected results:
-- - "Platform Managers can view all requests" on requests table
-- - "Platform Managers can manage announcements" on announcements table (from migration 028)
-- - get_user_counts() function exists

