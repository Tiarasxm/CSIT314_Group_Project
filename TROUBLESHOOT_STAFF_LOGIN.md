# Troubleshooting Staff Login

If staff login is not working, check the following:

## Common Issues

### 1. Pre-Set Accounts Not Created in Database

The staff accounts must exist in **both**:
- Supabase Auth (Authentication → Users)
- Your `users` table in the database

**To fix:**
1. Go to Supabase Dashboard → Authentication → Users
2. Check if the accounts exist:
   - `platform.manager@csr-platform.com`
   - `user.admin@csr-platform.com`
   - `csr.representative@csr-platform.com`

3. If they don't exist, create them:
   - Click "Add User" → "Create new user"
   - Enter email and password from `PRE_SET_ACCOUNTS.md`
   - Click "Create user"

4. After creating in Auth, update the `users` table:
   - Go to SQL Editor
   - Run this query (replace `<user_id>` with actual IDs from auth.users):

```sql
-- Get the user IDs first
SELECT id, email FROM auth.users WHERE email IN (
  'platform.manager@csr-platform.com',
  'user.admin@csr-platform.com',
  'csr.representative@csr-platform.com'
);

-- Then update the users table with the correct roles
UPDATE users 
SET role = 'platform-manager' 
WHERE email = 'platform.manager@csr-platform.com';

UPDATE users 
SET role = 'user-admin' 
WHERE email = 'user.admin@csr-platform.com';

UPDATE users 
SET role = 'csr-representative' 
WHERE email = 'csr.representative@csr-platform.com';
```

### 2. User Exists in Auth but Not in Users Table

If the user can authenticate but gets "not authorized" error:

**To fix:**
Run the migration script: `supabase/migrations/002_create_pre_set_accounts.sql`

Or manually insert:

```sql
-- Get user ID from auth.users first
SELECT id, email FROM auth.users WHERE email = 'platform.manager@csr-platform.com';

-- Then insert into users table (replace <user_id> with actual ID)
INSERT INTO users (id, email, name, role)
VALUES (
  '<user_id>',
  'platform.manager@csr-platform.com',
  'Platform Manager',
  'platform-manager'
);
```

### 3. Database Trigger Not Working

The `handle_new_user()` trigger should automatically create users in the `users` table when they're created in `auth.users`.

**To check:**
1. Go to Supabase Dashboard → Database → Functions
2. Verify `handle_new_user()` exists
3. Check Database → Triggers → `on_auth_user_created`

**To fix:**
Run the migration: `supabase/migrations/001_initial_schema.sql`

### 4. RLS Policies Blocking Access

Row Level Security might be blocking the query.

**To check:**
```sql
-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

**To fix:**
Make sure the RLS policies in `001_initial_schema.sql` are correct.

### 5. Wrong Password

Make sure you're using the correct passwords from `PRE_SET_ACCOUNTS.md`:
- Platform Manager: `PlatformManager2024!`
- User Admin: `UserAdmin2024!`
- CSR Representative: `CSRRep2024!`

## Testing Steps

1. **Test Authentication:**
   - Try logging in with one of the pre-set accounts
   - Check browser console for errors
   - Check Network tab for failed requests

2. **Check Database:**
   ```sql
   -- Check if user exists in users table
   SELECT * FROM users WHERE email = 'platform.manager@csr-platform.com';
   
   -- Check if user exists in auth.users
   SELECT id, email FROM auth.users WHERE email = 'platform.manager@csr-platform.com';
   ```

3. **Check Logs:**
   - Supabase Dashboard → Logs → API Logs
   - Look for authentication errors

## Quick Fix Script

Run this in Supabase SQL Editor to set up all pre-set accounts:

```sql
-- First, make sure users exist in auth.users (create them manually in Dashboard)
-- Then run this to ensure they exist in users table with correct roles

-- For each account, replace <user_id> with actual ID from auth.users
DO $$
DECLARE
  platform_manager_id UUID;
  user_admin_id UUID;
  csr_rep_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO platform_manager_id FROM auth.users WHERE email = 'platform.manager@csr-platform.com';
  SELECT id INTO user_admin_id FROM auth.users WHERE email = 'user.admin@csr-platform.com';
  SELECT id INTO csr_rep_id FROM auth.users WHERE email = 'csr.representative@csr-platform.com';

  -- Insert or update users
  INSERT INTO users (id, email, name, role)
  VALUES 
    (platform_manager_id, 'platform.manager@csr-platform.com', 'Platform Manager', 'platform-manager'),
    (user_admin_id, 'user.admin@csr-platform.com', 'User Administrator', 'user-admin'),
    (csr_rep_id, 'csr.representative@csr-platform.com', 'CSR Representative', 'csr-representative')
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name;
END $$;
```

## Still Not Working?

1. Check browser console for JavaScript errors
2. Check Network tab for failed API calls
3. Verify Supabase environment variables are set correctly
4. Make sure the database migrations have been run
5. Check Supabase Dashboard → Authentication → Settings for any restrictions

