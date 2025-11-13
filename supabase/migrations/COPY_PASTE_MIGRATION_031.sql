-- COPY THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- Migration 031: Fix Announcements Policy

-- Create safe function to check platform manager role
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

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Platform Managers can manage announcements" ON announcements;

-- Create new safe policy using the function
CREATE POLICY "Platform Managers can manage announcements" ON announcements
  FOR ALL
  USING (is_platform_manager())
  WITH CHECK (is_platform_manager());

