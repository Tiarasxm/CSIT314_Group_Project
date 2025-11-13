-- Create a SECURITY DEFINER function to safely get CSR information
-- This bypasses RLS and prevents infinite recursion issues

CREATE OR REPLACE FUNCTION get_csr_info(csr_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- This function runs with elevated privileges (SECURITY DEFINER)
  -- so it bypasses RLS policies and won't cause recursion
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    u.first_name,
    u.last_name
  FROM users u
  WHERE u.id = csr_id
    AND u.role = 'csr-representative';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_csr_info(UUID) TO authenticated;

-- Test the function (should return NULL for invalid/non-CSR IDs)
SELECT * FROM get_csr_info('00000000-0000-0000-0000-000000000000'::UUID);

