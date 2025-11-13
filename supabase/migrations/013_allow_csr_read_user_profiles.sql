-- Allow CSR representatives to read user profile information for request handling

DROP POLICY IF EXISTS "CSR reps can read user profiles" ON users;

CREATE POLICY "CSR reps can read user profiles" ON users
  FOR SELECT
  USING (get_user_role(auth.uid()) = 'csr-representative');

