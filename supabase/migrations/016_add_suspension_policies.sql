-- Add policies to prevent suspended users and CSRs from creating or modifying requests

-- Drop existing policies if they exist (for updates)
DROP POLICY IF EXISTS "Users can create their own requests (not suspended)" ON requests;
DROP POLICY IF EXISTS "Users can update their own pending requests (not suspended)" ON requests;
DROP POLICY IF EXISTS "CSRs can accept requests (not suspended)" ON requests;

-- Policy: Prevent suspended users from creating requests
CREATE POLICY "Users can create their own requests (not suspended)"
  ON requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'user'
      AND (users.is_suspended IS NULL OR users.is_suspended = FALSE)
    )
  );

-- Policy: Prevent suspended users from updating requests (marking complete, editing, etc.)
CREATE POLICY "Users can update their own pending requests (not suspended)"
  ON requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.is_suspended IS NULL OR users.is_suspended = FALSE)
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.is_suspended IS NULL OR users.is_suspended = FALSE)
    )
  );

-- Policy: Prevent suspended CSRs from accepting/updating requests
CREATE POLICY "CSRs can accept requests (not suspended)"
  ON requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'csr-representative'
      AND (users.is_suspended IS NULL OR users.is_suspended = FALSE)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'csr-representative'
      AND (users.is_suspended IS NULL OR users.is_suspended = FALSE)
    )
  );

-- Add comments
COMMENT ON POLICY "Users can create their own requests (not suspended)" ON requests
  IS 'Only non-suspended users can create new requests';

COMMENT ON POLICY "Users can update their own pending requests (not suspended)" ON requests
  IS 'Only non-suspended users can update their requests';

COMMENT ON POLICY "CSRs can accept requests (not suspended)" ON requests
  IS 'Only non-suspended CSRs can accept and update requests';

