-- COPY THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- Migration 030: Create Categories Table

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Insert default categories
INSERT INTO categories (name, display_order) VALUES
  ('Household Support', 1),
  ('Transportation', 2),
  ('Medical Assistance', 3),
  ('Food & Groceries', 4),
  ('Technology Support', 5),
  ('Other', 6)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read active categories
CREATE POLICY "Anyone can read active categories" ON categories
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Platform Managers can view all categories
CREATE POLICY "Platform Managers can view all categories" ON categories
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'platform-manager'
    )
  );

-- Only Platform Managers can manage categories
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

-- Auto-update updated_at timestamp
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

