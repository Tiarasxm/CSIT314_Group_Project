# 🚀 CSR Account Setup Instructions

## Issue Encountered

The `handle_new_user()` trigger had a bug with NULL concatenation that caused this error:
```
ERROR: operator does not exist: text ->> unknown
```

## ✅ Solution: Run Migrations in Order

### Step 1: Fix the Trigger Function
**Run this first:** `019_fix_handle_new_user_trigger.sql`

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of:
   ```
   supabase/migrations/019_fix_handle_new_user_trigger.sql
   ```
3. Click **Run**
4. You should see: `handle_new_user() trigger function updated successfully!`

### Step 2: Create CSR Accounts
**Run this second:** `018_add_more_csr_accounts.sql`

1. In Supabase SQL Editor
2. Copy and paste the contents of:
   ```
   supabase/migrations/018_add_more_csr_accounts.sql
   ```
3. Click **Run**
4. You should see a table showing 4 CSR accounts (including the original one)

---

## 📋 Expected Result

After running both migrations, you should have:

| # | Email | Name | Role |
|---|-------|------|------|
| 1 | csr.representative@csr-platform.com | CSR Representative | csr-representative |
| 2 | csr2@csr-platform.com | Sarah Johnson | csr-representative |
| 3 | csr3@csr-platform.com | Michael Chen | csr-representative |
| 4 | csr4@csr-platform.com | Emily Rodriguez | csr-representative |

**All passwords:** `CSRPassword123!`

---

## 🔍 Verify Accounts Were Created

Run this query in Supabase SQL Editor:

```sql
SELECT 
  u.email,
  u.name,
  u.role,
  u.is_suspended,
  u.created_at
FROM users u
WHERE u.role = 'csr-representative'
ORDER BY u.created_at DESC;
```

You should see all 4 CSR accounts listed.

---

## 🧪 Test the Accounts

### Login Test
1. Go to: `http://localhost:3000/staff/login`
2. Try each account:
   - Email: `csr2@csr-platform.com`
   - Password: `CSRPassword123!`
   - Should redirect to CSR dashboard

### Competition Test
1. Create a test pending request (as a regular user)
2. Open 2 browser windows
3. Login as `csr2@csr-platform.com` in window 1
4. Login as `csr3@csr-platform.com` in window 2
5. Both go to "New Requests"
6. Both try to assign volunteer to the same request
7. First one to confirm should succeed
8. Second one should get: "This request was just accepted by another CSR"

---

## 🛠️ What Was Fixed

### Before (Broken):
```sql
-- This line caused the error when first_name or last_name was NULL
(NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name')
```

### After (Fixed):
```sql
-- Now properly handles NULL values
CASE 
  WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL 
   AND NEW.raw_user_meta_data->>'last_name' IS NOT NULL 
  THEN (NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name')
  WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL 
  THEN NEW.raw_user_meta_data->>'first_name'
  WHEN NEW.raw_user_meta_data->>'last_name' IS NOT NULL 
  THEN NEW.raw_user_meta_data->>'last_name'
  ELSE 'User'
END
```

---

## ⚠️ Troubleshooting

### If Step 1 fails:
- Check that you have permission to modify functions
- Ensure you're logged in as a Supabase admin/owner

### If Step 2 fails after running Step 1:
- Check the error message
- Verify the trigger was actually updated by running:
  ```sql
  SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
  ```

### If accounts still don't show up:
- Check `auth.users` table:
  ```sql
  SELECT email, raw_user_meta_data 
  FROM auth.users 
  WHERE email LIKE 'csr%@csr-platform.com';
  ```
- Check `public.users` table:
  ```sql
  SELECT email, name, role 
  FROM users 
  WHERE email LIKE 'csr%@csr-platform.com';
  ```

---

## 📚 Related Documentation

- **CSR_ACCOUNTS.md** - Complete list of all CSR accounts
- **CSR_COMPETITIVE_ASSIGNMENT.md** - How the competitive system works
- **PRE_SET_ACCOUNTS.md** - Other pre-configured accounts

---

**Status:** ✅ Ready to run migrations
**Last Updated:** Created to fix trigger NULL concatenation issue

