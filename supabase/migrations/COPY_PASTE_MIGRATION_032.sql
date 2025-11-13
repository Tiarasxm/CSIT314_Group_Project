-- =====================================================
-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- Migration 032: Create Request Shortlists Junction Table
-- =====================================================

-- Create the junction table to allow multiple CSRs to shortlist the same request
CREATE TABLE IF NOT EXISTS request_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  csr_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, csr_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_request_shortlists_request_id ON request_shortlists(request_id);
CREATE INDEX IF NOT EXISTS idx_request_shortlists_csr_id ON request_shortlists(csr_id);

-- Migrate existing shortlist data to new table
INSERT INTO request_shortlists (request_id, csr_id)
SELECT id, shortlisted_by
FROM requests
WHERE shortlisted = true AND shortlisted_by IS NOT NULL
ON CONFLICT (request_id, csr_id) DO NOTHING;

-- Enable RLS
ALTER TABLE request_shortlists ENABLE ROW LEVEL SECURITY;

-- CSRs can view their own shortlists
CREATE POLICY "CSRs can view their own shortlists" ON request_shortlists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'csr-representative'
      AND users.id = csr_id
    )
  );

-- CSRs can create their own shortlists
CREATE POLICY "CSRs can create shortlists" ON request_shortlists
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'csr-representative'
      AND users.id = csr_id
    )
  );

-- CSRs can delete their own shortlists
CREATE POLICY "CSRs can delete their shortlists" ON request_shortlists
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'csr-representative'
      AND users.id = csr_id
    )
  );

-- Platform Managers can view all shortlists
CREATE POLICY "Platform Managers can view all shortlists" ON request_shortlists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'platform-manager'
    )
  );

-- Create function to get shortlist counts (safe for users to call)
CREATE OR REPLACE FUNCTION get_request_shortlist_counts(request_ids UUID[])
RETURNS TABLE (
  request_id UUID,
  shortlist_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.request_id,
    COUNT(*)::BIGINT as shortlist_count
  FROM request_shortlists rs
  WHERE rs.request_id = ANY(request_ids)
  GROUP BY rs.request_id;
END;
$$;

