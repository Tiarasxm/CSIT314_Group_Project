-- Allow users to delete their own pending requests
-- This enables the "withdraw request" functionality

DROP POLICY IF EXISTS "Users can delete own pending requests" ON requests;

CREATE POLICY "Users can delete own pending requests" ON requests
  FOR DELETE 
  USING (
    auth.uid() = user_id AND 
    status = 'pending'
  );

