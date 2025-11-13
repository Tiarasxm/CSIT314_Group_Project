# 🚨 EMERGENCY: Fix Infinite Recursion

## Error
```
Database error: infinite recursion detected in policy for relation "users"
```

## Immediate Fix - Restore Login

**Run this SQL RIGHT NOW in Supabase:**

```sql
-- Drop ALL problematic policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read CSR representative profiles" ON users;
DROP POLICY IF EXISTS "Allow reading CSR representative profiles" ON users;

-- Restore ORIGINAL working policy from migration 005
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (auth.uid() = id);
```

This will **immediately fix login for ALL users** (including User Admin).

---

## What Happened

Migration 022 created:
```sql
CREATE POLICY "Users can read own data" ON users
  FOR SELECT   USING (auth.uid() = id OR role = 'csr-representative');
```

The `OR role = 'csr-representative'` part causes infinite recursion in PostgreSQL.

---

## Step-by-Step Fix

### Step 1: Restore Login (URGENT - Do Now!)

Run migration `023_fix_infinite_recursion.sql` OR the SQL above.

**Test:** Login should work immediately for all users.

---

### Step 2: Add CSR Reading (Try After Login Works)

**Option A - Try This First:**

Run migration `025_simple_csr_read_policy.sql`

This creates TWO separate policies that shouldn't conflict:
1. Users read own data
2. CSR profiles are publicly readable

If this works: ✅ Perfect, you're done!  
If you still get recursion: ⬇️ Go to Option B

**Option B - Safe Function Approach:**

If Option A fails, run migration `024_add_get_csr_info_function.sql`

This creates a database function `get_csr_info(uuid)` that safely fetches CSR data.

Then update application code to use this function (see below).

---

## Application Code Changes (Only if using Option B)

If you use the function approach (Option B), update these files:

### File: `app/user/requests/[id]/page.tsx`

**Replace:**
```typescript
const { data: csr } = await supabase
  .from("users")
  .select("id, name, email, first_name, last_name")
  .eq("id", requestData.accepted_by)
  .single();
```

**With:**
```typescript
const { data: csrArray } = await supabase
  .rpc('get_csr_info', { csr_id: requestData.accepted_by });

const csr = csrArray?.[0] || null;
```

### File: `app/user/requests/page.tsx`

**Replace:**
```typescript
const { data: csrData } = await supabase
  .from("users")
  .select("id, name, email, first_name, last_name")
  .in("id", csrIds);
```

**With:**
```typescript
// Fetch CSR info using the safe function
const csrData = [];
for (const csrId of csrIds) {
  const { data } = await supabase
    .rpc('get_csr_info', { csr_id: csrId });
  if (data?.[0]) {
    csrData.push(data[0]);
  }
}
```

### File: `app/user/dashboard/page.tsx`

Same changes as `page.tsx` above.

---

## Testing Steps

### After Migration 023 (Restore Login):
1. ✅ User Admin can login
2. ✅ Regular users can login  
3. ✅ CSR can login
4. ❌ CSR email won't display yet (expected)

### After Migration 025 (If you try it):
1. ✅ Login still works
2. ✅ CSR email displays
OR
1. ❌ Get recursion error again → Use Option B instead

### After Migration 024 + Code Changes:
1. ✅ Login works
2. ✅ CSR email displays
3. ✅ No recursion errors

---

## Why This Happened

**Root Cause:** PostgreSQL RLS policies cannot check row data (`role = 'csr-representative'`) in some configurations without triggering recursion detection.

**Solution:** Either:
- Use completely separate policies (Option A)
- Use SECURITY DEFINER functions to bypass RLS (Option B)

---

## Priority Order

1. **NOW:** Run migration 023 → Restores login
2. **Test:** Verify everyone can login
3. **Then:** Try migration 025 → Attempt CSR reading via RLS
4. **If fails:** Use migration 024 + code changes → Function approach

---

## Quick Reference

**Restore login only:**
```bash
supabase/migrations/023_fix_infinite_recursion.sql
```

**Try RLS approach for CSR:**
```bash
supabase/migrations/025_simple_csr_read_policy.sql
```

**Safe function approach:**
```bash
supabase/migrations/024_add_get_csr_info_function.sql
# Then update code as shown above
```

---

**CRITICAL: Run migration 023 IMMEDIATELY to restore login!** 🚀

