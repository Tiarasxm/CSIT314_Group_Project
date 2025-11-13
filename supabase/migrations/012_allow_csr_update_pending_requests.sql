-- Allow CSR representatives to update pending requests (for shortlisting)
-- This policy allows CSR reps to update the shortlisted field on pending requests

DROP POLICY IF EXISTS "CSR reps can update pending requests" ON requests;

CREATE POLICY "CSR reps can update pending requests" ON requests
  FOR UPDATE 
  USING (
    status = 'pending' AND
    get_user_role(auth.uid()) = 'csr-representative'
  )
  WITH CHECK (
    status = 'pending' AND
    get_user_role(auth.uid()) = 'csr-representative'
  );

