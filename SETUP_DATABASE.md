# Database Setup - Quick Guide

The admin accounts were created in Supabase Auth, but the database tables don't exist yet. Follow these steps:

## Step 1: Run the Database Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ayqmycfvhtqlusjqmsei`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- ✅ `users` table
- ✅ `companies` table
- ✅ `requests` table
- ✅ Database triggers
- ✅ Row Level Security policies

## Step 2: Add Admin Accounts to Users Table

After running the migration, you have two options:

### Option A: Use the Migration File (Easiest)

1. In SQL Editor, click **New Query**
2. Copy and paste the entire contents of `supabase/migrations/003_add_admin_accounts.sql`
3. Click **Run**

This will automatically:
- ✅ Find the admin accounts in `auth.users`
- ✅ Add them to the `users` table with correct roles
- ✅ Show a verification query at the end

### Option B: Manual SQL (Alternative)

If you prefer, run this SQL manually:

```sql
-- Get user IDs and insert into users table
DO $$
DECLARE
  platform_manager_id UUID;
  user_admin_id UUID;
  csr_rep_id UUID;
BEGIN
  -- Get user IDs from auth.users
  SELECT id INTO platform_manager_id 
  FROM auth.users 
  WHERE email = 'platform.manager@csr-platform.com';
  
  SELECT id INTO user_admin_id 
  FROM auth.users 
  WHERE email = 'user.admin@csr-platform.com';
  
  SELECT id INTO csr_rep_id 
  FROM auth.users 
  WHERE email = 'csr.representative@csr-platform.com';

  -- Insert into users table with correct roles
  INSERT INTO users (id, email, name, first_name, last_name, role)
  VALUES 
    (platform_manager_id, 'platform.manager@csr-platform.com', 'Platform Manager', 'Platform', 'Manager', 'platform-manager'),
    (user_admin_id, 'user.admin@csr-platform.com', 'User Administrator', 'User', 'Administrator', 'user-admin'),
    (csr_rep_id, 'csr.representative@csr-platform.com', 'CSR Representative', 'CSR', 'Representative', 'csr-representative')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;
    
  RAISE NOTICE 'Admin accounts added to users table successfully!';
END $$;
```

## Step 3: Verify Setup

Run this query to verify everything is set up correctly:

```sql
SELECT u.id, u.email, u.name, u.role, au.email_confirmed_at
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.email IN (
  'platform.manager@csr-platform.com',
  'user.admin@csr-platform.com',
  'csr.representative@csr-platform.com'
)
ORDER BY u.role;
```

You should see all 3 accounts with their correct roles!

## Quick Copy-Paste Commands

### 1. Create Tables (Run First)
Copy the entire file: `supabase/migrations/001_initial_schema.sql` and run it in SQL Editor.

### 2. Add Admin Accounts (Run Second)
Copy and run the SQL from Step 2 above.

### 3. Verify (Optional)
Run the verification query from Step 3.

## After Setup

Once the database is set up, you can:
- ✅ Login at `/staff/login` with the admin accounts
- ✅ The database trigger will automatically create users in the `users` table for new signups
- ✅ All authentication flows will work properly

## Troubleshooting

**Error: "relation 'users' does not exist"**
- You haven't run the migration yet. Run `001_initial_schema.sql` first.

**Error: "duplicate key value violates unique constraint"**
- The user already exists. The `ON CONFLICT` clause will update it, so this is fine.

**Accounts created but can't login**
- Make sure the users table has the correct roles
- Check that `email_confirmed_at` is not null in `auth.users`

