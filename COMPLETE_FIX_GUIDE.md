# ✅ COMPLETE FIX: Login + CSR Email Display

## Summary
Infinite recursion error is caused by RLS policies that check the `role` column. The solution is to use a database function instead.

---

## 🚀 **Step-by-Step Fix (Do in Order)**

### Step 1: Run Migration 026 (Database Fix)
**This restores login for everyone**

In Supabase SQL Editor, run:
```
supabase/migrations/026_final_fix_no_recursion.sql
```

OR copy/paste this SQL:
```sql
-- Remove ALL policies that check role
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Allow reading CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Authenticated users can read CSR profiles" ON users;
DROP POLICY IF EXISTS "Public CSR profiles readable" ON users;

-- Create only the simple, safe policy
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

**Test:** All users (User Admin, CSRs, regular users) can login ✅

---

### Step 2: Ensure get_csr_info() Function Exists

In Supabase SQL Editor, run:
```
supabase/migrations/024_add_get_csr_info_function.sql
```

This creates a safe function to fetch CSR information without triggering RLS.

---

### Step 3: Code is Already Updated! ✅

I've already updated these files to use the safe `get_csr_info()` function:
- ✅ `app/user/requests/[id]/page.tsx`
- ✅ `app/user/requests/page.tsx`
- ✅ `app/user/dashboard/page.tsx`

**Changes made:**
- Replaced `supabase.from("users").select(...).eq("id", csrId)` 
- With `supabase.rpc('get_csr_info', { csr_id: csrId })`

---

### Step 4: Test Everything

1. **Refresh your browser** (Ctrl+R or Cmd+R)
2. **Test User Admin login** - Should work ✅
3. **Test regular user login** - Should work ✅
4. **Navigate to a completed/confirmed request**
5. **Check CSR email displays** - Should show name and email ✅
6. **Check browser console** - Should show CSR data loaded ✅

---

## 🎯 What We Did

### Problem
```
RLS Policy → checks "role = 'csr-representative'" 
          → requires reading users table
          → triggers RLS policy again
          → INFINITE RECURSION
```

### Solution
```
RLS Policy → only checks "auth.uid() = id" (no recursion)
Application → calls get_csr_info(uuid) function
Function → uses SECURITY DEFINER (bypasses RLS)
Result → CSR data fetched safely ✅
```

---

## 📊 Verification

### Check Policies in Supabase:
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT'
ORDER BY policyname;
```

**Should show ONLY:**
- `Users can read own data` with `USING (auth.uid() = id)`

**Should NOT show:**
- ❌ Any policy checking `role = 'csr-representative'`
- ❌ Multiple conflicting SELECT policies

### Check Function Exists:
```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'get_csr_info';
```

Should return the function definition.

### Test Function:
```sql
-- Test with a known CSR ID (replace with actual ID)
SELECT * FROM get_csr_info('fa43e117-09cf-471e-bdd6-9bdd9683313a'::UUID);
```

Should return CSR name, email, etc.

---

## 🔧 How the Function Works

```sql
CREATE FUNCTION get_csr_info(csr_id UUID)
RETURNS TABLE (id UUID, name TEXT, email TEXT, ...)
SECURITY DEFINER  -- ← This is the key!
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, ...
  FROM users u
  WHERE u.id = csr_id AND u.role = 'csr-representative';
END;
$$;
```

**SECURITY DEFINER** means:
- Function runs with database owner privileges
- Bypasses RLS policies completely
- No risk of infinite recursion
- Safe because we only return CSR profiles (public info)

---

## 📝 Code Changes Summary

### Before (Broken):
```typescript
const { data: csr } = await supabase
  .from("users")  // ← Triggers RLS recursion
  .select("id, name, email")
  .eq("id", csrId)
  .single();
```

### After (Fixed):
```typescript
const { data: csrResult } = await supabase
  .rpc('get_csr_info', { csr_id: csrId });  // ← Bypasses RLS safely

const csr = csrResult?.[0];
```

---

## ⚠️ Important Notes

1. **Do NOT add any RLS policy** that checks the `role` column
2. **Do NOT try** to query users table directly for CSRs
3. **Always use** the `get_csr_info()` function for CSR data
4. **The function is safe** - it only returns public CSR info (name, email)

---

## 🎉 Expected Result

After completing all steps:

✅ User Admin can login  
✅ Regular users can login  
✅ CSR representatives can login  
✅ CSR email displays on request pages  
✅ CSR email displays on dashboard  
✅ No infinite recursion errors  
✅ No 500 internal server errors  
✅ Console shows CSR data loading correctly  

---

## 🐛 Troubleshooting

### If login still doesn't work:
```sql
-- Check which policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'users';

-- If you see multiple SELECT policies, drop them all:
DROP POLICY IF EXISTS "<policy_name>" ON users;

-- Then recreate ONLY the simple one:
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

### If CSR email doesn't display:
1. Check function exists: `SELECT * FROM get_csr_info('<some-csr-id>'::UUID);`
2. Check browser console for errors
3. Verify CSR has `accepted_by` field populated in database

### If you get "function does not exist":
Run migration 024 again to create the function.

---

## Files Modified

1. **Migrations:**
   - `023_fix_infinite_recursion.sql` - Removes bad policies
   - `024_add_get_csr_info_function.sql` - Creates safe function
   - `026_final_fix_no_recursion.sql` - Final policy cleanup

2. **Application Code (Already Updated):**
   - `app/user/requests/[id]/page.tsx` - Uses function
   - `app/user/requests/page.tsx` - Uses function
   - `app/user/dashboard/page.tsx` - Uses function

---

**Status:** Ready to test! 🚀

Run migration 026, ensure migration 024 is applied, refresh browser, and everything should work!

