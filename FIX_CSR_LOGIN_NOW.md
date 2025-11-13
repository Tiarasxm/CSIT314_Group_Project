# 🚨 URGENT: Fix CSR Login Issue

## The Problem
CSR accounts cannot log in because their `raw_user_meta_data` in the auth system might not have the role field set correctly.

## The Solution
Run this migration to fix all staff account metadata:

### Steps to Fix:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Open your project

2. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste This SQL**
   - Open file: `supabase/migrations/033_fix_csr_metadata.sql`
   - Copy ALL the contents
   - Paste into the SQL editor

4. **Run the Query**
   - Click the "Run" button (or press Cmd+Enter)
   - Wait for it to complete

5. **Verify Success**
   - You should see a table showing all staff accounts with their roles
   - Check that `role_in_metadata` column shows the correct roles:
     - `csr-representative` for all CSR accounts
     - `platform-manager` for manager account
     - `user-admin` for admin account

6. **Test Login**
   - Go to http://localhost:3000/staff/login
   - Try logging in with:
     - Email: `csr2@csr-platform.com`
     - Password: `CSRPassword123!`
   - Should now work!

## What This Does
This migration updates the `auth.users` table to ensure all staff accounts have their role stored in `raw_user_meta_data`. This allows the login page to get the role without querying the `users` table, which avoids RLS (Row Level Security) issues.

## After Running Migration
- ✅ All CSR accounts will work
- ✅ Platform Manager will work
- ✅ User Admin will work
- ✅ No more "Database error querying schema"

## If You Still Have Issues
1. **Clear browser cache completely** (Cmd+Shift+Delete on Mac)
2. **Restart your browser**
3. **Try in Incognito/Private mode**
4. **Check the browser console** for any errors (F12)

