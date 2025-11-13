# 🚨 URGENT: Fix User Login

## Problem
After running migration 020, users cannot login - getting "user-not_found" error.

## Immediate Fix

Run this SQL **RIGHT NOW** in Supabase SQL Editor:

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users;
```

This will restore login functionality immediately.

---

## Then Run Migration 021

After login is restored, run the corrected migration:
```
supabase/migrations/021_fix_user_login_policy.sql
```

This adds the CSR reading capability back BUT without breaking user login.

---

## What Went Wrong

The policy I added in migration 020:
```sql
CREATE POLICY "Users can read CSR representative profiles" ON users
  FOR SELECT
  USING (role = 'csr-representative');
```

This may have conflicted with existing authentication policies, preventing users from reading their own profile during login.

## The Fixed Version

Migration 021 uses a combined approach:
```sql
CREATE POLICY "Allow reading CSR representative profiles" ON users
  FOR SELECT
  USING (
    auth.uid() = id              -- Users can read their OWN profile (login)
    OR
    role = 'csr-representative'  -- Users can read CSR profiles
  );
```

---

## Steps to Fix:

### Step 1: Immediate Fix (Restore Login)
```sql
DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users;
```

### Step 2: Test Login
Try logging in - should work now.

### Step 3: Run Proper Fix
Run migration 021 to add CSR reading back properly.

### Step 4: Test Everything
- Login should work ✅
- CSR email should display ✅

---

**Priority: RUN STEP 1 NOW!**

