-- Fix Announcements RLS Policy
-- Create a safe function to check if user is platform manager

-- =============================================
-- Create safe function to check platform manager role
-- =============================================

CREATE OR REPLACE FUNCTION is_platform_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'platform-manager'
  );
END;
$$;

-- =============================================
-- Drop existing problematic policies
-- =============================================

DROP POLICY IF EXISTS "Platform Managers can manage announcements" ON announcements;

-- =============================================
-- Create new safe policy using the function
-- =============================================

-- Platform Managers can insert, update, delete announcements
CREATE POLICY "Platform Managers can manage announcements" ON announcements
  FOR ALL
  USING (is_platform_manager())
  WITH CHECK (is_platform_manager());

-- =============================================
-- Verification
-- =============================================

-- Verify function exists
SELECT 
  proname as function_name,
  pronargs as num_args
FROM pg_proc
WHERE proname = 'is_platform_manager';

-- Verify policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'announcements'
ORDER BY policyname;

-- ✅ Expected results:
-- - is_platform_manager() function exists
-- - "Anyone can read announcements" policy (SELECT)
-- - "Platform Managers can manage announcements" policy (ALL)

