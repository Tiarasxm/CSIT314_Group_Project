-- Add RLS policy to allow User Admins to read all requests
-- This is needed for the User Admin dashboard to display user statistics

-- Drop if exists (for idempotency)
DROP POLICY IF EXISTS "User admins can read all requests" ON requests;

-- Create policy for User Admins to read all requests
CREATE POLICY "User admins can read all requests" ON requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'user-admin'
    )
  );

-- Add comment
COMMENT ON POLICY "User admins can read all requests" ON requests
  IS 'Allows User Admins to view all requests for user management purposes';

