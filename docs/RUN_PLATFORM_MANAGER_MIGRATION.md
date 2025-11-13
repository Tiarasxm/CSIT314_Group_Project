# 🚀 Quick Setup: Platform Manager

## Step 1: Run Database Migrations

Go to your **Supabase Dashboard** → **SQL Editor** and run these migrations **in order**:

---

### Migration 1: Create Announcements Table
**File:** `supabase/migrations/028_create_announcements_table.sql`

```sql
-- Create Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can read announcements
CREATE POLICY "Anyone can read announcements" ON announcements
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Only Platform Managers can manage announcements
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

-- Auto-update updated_at timestamp
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
```

**Click "Run" in Supabase SQL Editor**

---

### Migration 2: Platform Manager Permissions
**File:** `supabase/migrations/029_platform_manager_permissions.sql`

```sql
-- Drop policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Platform Managers can view all requests" ON requests;

-- Platform Manager can view all requests
CREATE POLICY "Platform Managers can view all requests" ON requests
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'platform-manager'
    )
  );

-- Platform Manager can view user stats
CREATE OR REPLACE FUNCTION get_user_counts()
RETURNS TABLE (
  total_users BIGINT,
  total_csrs BIGINT,
  total_user_admins BIGINT,
  total_platform_managers BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'platform-manager'
  ) THEN
    RAISE EXCEPTION 'Only platform managers can view user counts';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE role = 'user') AS total_users,
    COUNT(*) FILTER (WHERE role = 'csr-representative') AS total_csrs,
    COUNT(*) FILTER (WHERE role = 'user-admin') AS total_user_admins,
    COUNT(*) FILTER (WHERE role = 'platform-manager') AS total_platform_managers
  FROM users;
END;
$$;
```

**Click "Run" in Supabase SQL Editor**

---

## Step 2: Login and Test

1. **Login URL:** `http://localhost:3000/staff/login`
2. **Email:** `platform.manager@csr-platform.com`
3. **Password:** `PlatformManager2024!`

---

## Step 3: Test Features

### ✅ Dashboard
- Should show stats: Total Requests, Announcements, Users, CSRs
- Quick action cards should navigate correctly

### ✅ Categories (`/platform-manager/categories`)
- Add a new category
- Edit an existing category
- Remove a category

### ✅ Announcements (`/platform-manager/announcements`)
- Create a new announcement
- Edit an announcement
- Delete an announcement

### ✅ All Requests (`/platform-manager/requests`)
- View all requests from all users
- Filter by status
- Search by title, category, user
- Select multiple requests
- Export selected requests to PDF

---

## 🎉 Done!

Your Platform Manager is fully operational with:
- ✅ Sidebar navigation
- ✅ Categories management
- ✅ Announcements CRUD
- ✅ View all requests
- ✅ Export to PDF with checkbox selection
- ✅ Dashboard with statistics

## 📚 Full Documentation
See `PLATFORM_MANAGER_SETUP.md` for complete documentation.
