-- Create Categories Table
-- This table stores service categories that are used throughout the platform
-- Only Platform Managers can create, edit, and delete categories

-- =============================================
-- Create categories table
-- =============================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- =============================================
-- Insert default categories
-- =============================================

INSERT INTO categories (name, display_order) VALUES
  ('Household Support', 1),
  ('Transportation', 2),
  ('Medical Assistance', 3),
  ('Food & Groceries', 4),
  ('Technology Support', 5),
  ('Other', 6)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- Enable RLS
-- =============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- Everyone (authenticated users) can read active categories
CREATE POLICY "Anyone can read active categories" ON categories
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Platform Managers can view all categories (including inactive)
CREATE POLICY "Platform Managers can view all categories" ON categories
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'platform-manager'
    )
  );

-- Only Platform Managers can insert, update, delete categories
CREATE POLICY "Platform Managers can manage categories" ON categories
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

CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at_trigger
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

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
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Verify default categories were inserted
SELECT id, name, display_order, is_active FROM categories ORDER BY display_order;

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'categories'
ORDER BY policyname;

-- ✅ Expected results:
-- - categories table exists with 6 default categories
-- - "Anyone can read active categories" policy (SELECT)
-- - "Platform Managers can view all categories" policy (SELECT)
-- - "Platform Managers can manage categories" policy (ALL)

