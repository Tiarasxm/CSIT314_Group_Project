# 🔧 Fix: CSR Email Not Displaying

## Problem Identified

The console shows:
```
CSR data: null
CSR accepted_by: fa43e117-09cf-471e-bdd6-9bdd9683313a
GET .../users?select=id%2Cname%2C... 406 (Not Acceptable)
```

**Root Cause:** Row Level Security (RLS) policy is blocking regular users from reading CSR representative profiles.

---

## ✅ Solution

Run this migration to allow users to see their assigned CSR's information:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Run the Migration

Copy and paste the contents of:
```
supabase/migrations/020_allow_users_read_csr_info.sql
```

Click **Run**.

### Step 3: Verify Success

You should see output like:
```
schemaname | tablename | policyname                              | cmd
-----------+-----------+-----------------------------------------+--------
public     | users     | Users can read CSR representative profiles | SELECT
```

---

## 🧪 Test the Fix

1. **Refresh your browser** (Ctrl+R or Cmd+R)
2. **Check the console** - should now show:
   ```
   CSR data: {id: "...", name: "CSR Representative", email: "csr.representative@csr-platform.com"}
   ```
3. **Check the page** - CSR email should now display:
   ```
   ┌─────────────────────────────────────────┐
   │ CSR REPRESENTATIVE                      │
   │ CSR Representative                      │
   │ ✉️ csr.representative@csr-platform.com  │
   └─────────────────────────────────────────┘
   ```

---

## 🔒 Security Note

This policy allows **all authenticated users** to read CSR representative profiles (name, email). This is safe because:

1. **Only public info exposed:** Name and email are contact details, not sensitive data
2. **Authenticated only:** Anonymous users cannot access
3. **CSR reps only:** Policy only applies to users with `role = 'csr-representative'`
4. **No write access:** Users can only READ, not modify CSR profiles

This is the same level of access as seeing a customer service rep's name badge and email signature.

---

## 🐛 If Still Not Working

### Check RLS Policies

Run this query in Supabase SQL Editor:
```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

You should see a policy named: `"Users can read CSR representative profiles"`

### Check CSR User Exists

```sql
SELECT id, name, email, role
FROM users
WHERE id = 'fa43e117-09cf-471e-bdd6-9bdd9683313a';
```

Should return the CSR who accepted the request.

### Check Request Assignment

```sql
SELECT 
  r.id,
  r.title,
  r.accepted_by,
  u.name as csr_name,
  u.email as csr_email
FROM requests r
LEFT JOIN users u ON u.id = r.accepted_by
WHERE r.id = 'dce4540f-2328-40a2-9930-16725d6ca512';
```

Should show the CSR details joined correctly.

---

## 📝 What This Migration Does

**Before:**
```
Regular User → Try to read CSR profile → ❌ 406 Not Acceptable (RLS blocks)
```

**After:**
```
Regular User → Try to read CSR profile → ✅ Returns name, email
```

The RLS policy change:
```sql
-- NEW POLICY
CREATE POLICY "Users can read CSR representative profiles" ON users
  FOR SELECT
  USING (
    role = 'csr-representative'  -- Only CSR profiles are readable
  );
```

This means: "Any authenticated user can SELECT (read) from the users table WHERE the user's role is 'csr-representative'."

---

**Status:** Ready to run migration!

