# 🔧 FINAL FIX: Login + CSR Email Display

## Problem
Multiple conflicting RLS policies are causing:
- `500 Internal Server Error`
- `user_not_found` on login

## ✅ One-Step Solution

**Run this migration in Supabase SQL Editor:**

```
supabase/migrations/022_clean_fix_user_policies.sql
```

This migration:
1. ✅ Removes all conflicting policies (020 and 021)
2. ✅ Recreates the "Users can read own data" policy cleanly
3. ✅ Includes CSR reading capability in the same policy

---

## What This Does

### Before (Broken):
```
Policy 1: "Users can read own data" → auth.uid() = id
Policy 2: "Users can read CSR representative profiles" → role = 'csr-representative'
Policy 3: "Allow reading CSR representative profiles" → auth.uid() = id OR role = 'csr-representative'
Result: CONFLICT → 500 Error
```

### After (Fixed):
```
Policy: "Users can read own data" → auth.uid() = id OR role = 'csr-representative'
Result: Clean, single policy ✅
```

---

## How to Run

### Option 1: Run Migration File (Recommended)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste entire contents of:
   ```
   supabase/migrations/022_clean_fix_user_policies.sql
   ```
3. Click **Run**

### Option 2: Run SQL Directly

Copy and paste this into Supabase SQL Editor:

```sql
-- Remove conflicting policies
DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Allow reading CSR representative profiles" ON users;

-- Recreate main policy with both capabilities
DROP POLICY IF EXISTS "Users can read own data" ON users;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (
    auth.uid() = id
    OR
    role = 'csr-representative'
  );
```

---

## Verify Success

After running the migration, you should see:

```
schemaname | tablename | policyname             | cmd    | qual
-----------+-----------+------------------------+--------+------------------------------
public     | users     | Users can read own data| SELECT | ((auth.uid() = id) OR (role = 'csr-representative'))
```

---

## Test Everything

### 1. Test Login ✅
- Refresh browser
- Login should work immediately
- No more "user_not_found" error

### 2. Test CSR Email Display ✅
- Navigate to a completed/confirmed request
- Console should show:
  ```
  CSR data: {id: "...", name: "CSR Representative", email: "csr.representative@csr-platform.com"}
  ```
- Page should display CSR email with icon

### 3. Check Console
- Should see NO errors
- Should see successful API calls

---

## Why This Works

**Single Policy Approach:**
- Only ONE policy controls user reads
- Clear, simple logic: own profile OR CSR profile
- No conflicts between multiple policies
- PostgreSQL combines the OR conditions efficiently

**Previous Approach (Failed):**
- Multiple policies with overlapping logic
- PostgreSQL couldn't resolve conflicts
- Created 500 errors and login failures

---

## If Still Having Issues

### Check Current Policies
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

You should see:
- `Users can read own data` ✅
- `Users can update own data` ✅
- `User admins can read all users` ✅
- Other admin policies ✅

You should NOT see:
- ❌ `Users can read CSR representative profiles`
- ❌ `Allow reading CSR representative profiles`

### Completely Reset User Policies (Nuclear Option)

If migration 022 doesn't work, run this:

```sql
-- Drop ALL SELECT policies on users
DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Allow reading CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Staff can read own data" ON users;

-- Create fresh policy
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (
    auth.uid() = id
    OR
    role = 'csr-representative'
  );
```

---

## Summary

**Migration to run:** `022_clean_fix_user_policies.sql`

**Result:**
- ✅ Login works
- ✅ CSR email displays
- ✅ No 500 errors
- ✅ Clean, single policy

**Priority:** Run this NOW to fix both issues at once! 🚀

