-- Create Announcements Table
-- This table stores announcements that are visible to all users
-- Only Platform Managers can create, edit, and delete announcements

-- =============================================
-- Create announcements table
-- =============================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- =============================================
-- Enable RLS
-- =============================================

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- Everyone (authenticated users) can read announcements
CREATE POLICY "Anyone can read announcements" ON announcements
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Only Platform Managers can insert, update, delete announcements
CREATE POLICY "Platform Managers can manage announcements" ON announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'platform-manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'platform-manager'
    )
  );

-- =============================================
-- Add trigger to update updated_at timestamp
-- =============================================

CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcements_updated_at_trigger
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

-- =============================================
-- Verification
-- =============================================

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'announcements'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'announcements'
ORDER BY policyname;

-- ✅ Expected results:
-- - announcements table exists with columns: id, title, content, created_at, updated_at
-- - "Anyone can read announcements" policy (SELECT)
-- - "Platform Managers can manage announcements" policy (ALL)

