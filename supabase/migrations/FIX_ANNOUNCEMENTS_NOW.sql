-- EMERGENCY FIX: Announcements Creation
-- Run this ENTIRE script in Supabase SQL Editor

-- =============================================
-- STEP 1: Create helper function (bypasses RLS)
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
-- STEP 2: Drop ALL existing policies on announcements
-- =============================================

DROP POLICY IF EXISTS "Anyone can read announcements" ON announcements;
DROP POLICY IF EXISTS "Platform Managers can manage announcements" ON announcements;

-- =============================================
-- STEP 3: Create new clean policies
-- =============================================

-- Policy 1: Everyone can read announcements
CREATE POLICY "Anyone can read announcements" ON announcements
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Policy 2: Platform Managers can INSERT announcements
CREATE POLICY "Platform Managers can insert announcements" ON announcements
  FOR INSERT
  WITH CHECK (is_platform_manager());

-- Policy 3: Platform Managers can UPDATE announcements
CREATE POLICY "Platform Managers can update announcements" ON announcements
  FOR UPDATE
  USING (is_platform_manager())
  WITH CHECK (is_platform_manager());

-- Policy 4: Platform Managers can DELETE announcements
CREATE POLICY "Platform Managers can delete announcements" ON announcements
  FOR DELETE
  USING (is_platform_manager());

-- =============================================
-- STEP 4: Verify setup
-- =============================================

-- Check function exists
SELECT 'Function exists:' as check_type, proname 
FROM pg_proc 
WHERE proname = 'is_platform_manager';

-- Check policies
SELECT 'Policies:' as check_type, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'announcements'
ORDER BY policyname;

-- =============================================
-- EXPECTED OUTPUT:
-- You should see:
-- 1. is_platform_manager function
-- 2. Four policies: read (SELECT), insert, update, delete
-- =============================================

