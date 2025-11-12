# Create Admin Accounts - Quick Guide

This guide will help you create the pre-set admin accounts so you can login immediately.

## Option 1: Automated Script (Recommended) ⚡

### Step 1: Get Your Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Scroll down to **Project API keys**
5. Copy the **`service_role`** key (⚠️ Keep this secret!)

### Step 2: Add to Environment Variables

Add the service role key to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ayqmycfvhtqlusjqmsei.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Run the Script

```bash
npm run create-admins
```

That's it! The script will:
- ✅ Create all 3 admin accounts in Supabase Auth
- ✅ Set their passwords
- ✅ Create/update them in the users table with correct roles
- ✅ Auto-confirm their emails

## Option 2: Manual Setup (If Script Doesn't Work)

### Step 1: Create Users in Supabase Auth

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Create each account:

**Account 1: Platform Manager**
- Email: `platform.manager@csr-platform.com`
- Password: `PlatformManager2024!`
- Auto Confirm Email: ✅ (checked)

**Account 2: User Admin**
- Email: `user.admin@csr-platform.com`
- Password: `UserAdmin2024!`
- Auto Confirm Email: ✅ (checked)

**Account 3: CSR Representative**
- Email: `csr.representative@csr-platform.com`
- Password: `CSRRep2024!`
- Auto Confirm Email: ✅ (checked)

### Step 2: Update Users Table

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this script (it will get user IDs and update roles):

```sql
-- Get user IDs first
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

  -- Insert or update users in users table
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
    
  RAISE NOTICE 'Admin accounts created/updated successfully!';
END $$;
```

## Login Credentials

After setup, use these credentials at `/staff/login`:

### Platform Manager
- **Email:** `platform.manager@csr-platform.com`
- **Password:** `PlatformManager2024!`
- **Dashboard:** `/platform-manager/dashboard`

### User Admin
- **Email:** `user.admin@csr-platform.com`
- **Password:** `UserAdmin2024!`
- **Dashboard:** `/user-admin/dashboard`

### CSR Representative
- **Email:** `csr.representative@csr-platform.com`
- **Password:** `CSRRep2024!`
- **Dashboard:** `/csr-representative/dashboard`

## Troubleshooting

### Script Error: "Missing environment variables"
- Make sure `.env.local` exists in the project root
- Add `SUPABASE_SERVICE_ROLE_KEY=your-key-here` to `.env.local`
- Restart your terminal and try again

### Script Error: "Permission denied"
- Make sure you're using the **service_role** key, not the anon key
- The service_role key has admin permissions

### "User already exists" but can't login
- The user might exist in auth but not in the users table
- Run the SQL script from Option 2 to fix it

### Still can't login?
- Check browser console for errors
- Verify the accounts exist in both `auth.users` and `users` table
- Make sure the database trigger `handle_new_user()` is working

## Verify Accounts Were Created

Run this in SQL Editor to verify:

```sql
SELECT u.id, u.email, u.name, u.role, au.email_confirmed_at
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.email IN (
  'platform.manager@csr-platform.com',
  'user.admin@csr-platform.com',
  'csr.representative@csr-platform.com'
);
```

You should see all 3 accounts with their correct roles!

