-- COPY THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- Migration 029: Platform Manager Permissions

-- Drop policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Platform Managers can view all requests" ON requests;

-- Platform Manager can view all requests
CREATE POLICY "Platform Managers can view all requests" ON requests
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'platform-manager'
    )
  );

-- Platform Manager can view user stats
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

