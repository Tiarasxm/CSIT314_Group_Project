-- Allow users to insert their own record if it doesn't exist
-- This is needed when the trigger fails or user was created before trigger was set up

DROP POLICY IF EXISTS "Users can insert own record" ON users;

CREATE POLICY "Users can insert own record" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id AND 
    role = 'user'
  );

