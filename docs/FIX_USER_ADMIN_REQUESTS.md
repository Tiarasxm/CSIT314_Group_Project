# Fix: User Admin Cannot See User Requests

## 🔴 Problem

User Admins can see user profile information but request counts show **0** even when users have many requests:
- Request Managed: 0
- In-Progress: 0  
- Completed: 0
- Recent Requests: "No requests yet"

## 🔍 Root Cause

**Missing RLS (Row Level Security) Policy**

The database has RLS policies that allow:
- ✅ **Platform Managers** to read all requests
- ✅ **Users** to read their own requests
- ✅ **CSR Representatives** to read pending and accepted requests
- ❌ **User Admins** - NO POLICY TO READ REQUESTS

Without the proper RLS policy, User Admins are blocked from querying the `requests` table, even though they need this access to display user statistics.

## ✅ Solution

### Step 1: Run the Database Migration

Execute the new migration file in your Supabase SQL Editor:

**File:** `supabase/migrations/017_add_user_admin_requests_access.sql`

```sql
-- Add RLS policy to allow User Admins to read all requests
DROP POLICY IF EXISTS "User admins can read all requests" ON requests;

CREATE POLICY "User admins can read all requests" ON requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'user-admin'
    )
  );

COMMENT ON POLICY "User admins can read all requests" ON requests
  IS 'Allows User Admins to view all requests for user management purposes';
```

### Step 2: How to Apply

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy and paste the migration SQL
4. Click **Run**

**Option B: Using Supabase CLI**
```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 3: Verify the Fix

1. Login as a User Admin
2. Navigate to **User Management**
3. Click **View** on any user who has requests
4. You should now see:
   - ✅ Correct request counts
   - ✅ Recent requests list
   - ✅ Request statistics

## 🐛 Debugging

The code now includes console logging to help diagnose issues. Check your browser console for:

```javascript
// For regular users
Request stats for user: {userId} {
  total: X,
  inProgress: Y,
  completed: Z,
  recentCount: N
}

// For CSR Representatives  
CSR request stats for user: {userId} {
  total: X,
  inProgress: Y,
  completed: Z
}
```

If you see errors like:
- `"new row violates row-level security policy"` → RLS policy not applied
- `"permission denied for table requests"` → RLS policy not applied

## 📊 What Gets Fixed

**Before Migration:**
```
Request Managed: 0  ❌
In-Progress: 0      ❌
Completed: 0        ❌
Recent Requests: No requests yet ❌
```

**After Migration:**
```
Request Managed: 5  ✅
In-Progress: 2      ✅
Completed: 3        ✅
Recent Requests: [List of 5 most recent] ✅
```

## 🔐 Security Note

This policy allows User Admins to read ALL requests in the system, which is appropriate because:
- User Admins need to view user activity for account management
- This matches the access level of Platform Managers
- User Admins already have access to all user data
- Read-only access (SELECT only, no INSERT/UPDATE/DELETE)

## 📝 Files Modified

1. **New Migration:** `supabase/migrations/017_add_user_admin_requests_access.sql`
2. **Enhanced Debugging:** `app/user-admin/users/[id]/page.tsx`
   - Added error logging
   - Added console debugging
   - Better error messages

## ✅ Checklist

- [ ] Run migration in Supabase SQL Editor
- [ ] Verify policy exists: Check Supabase Dashboard → Authentication → Policies → requests table
- [ ] Test as User Admin viewing a user with requests
- [ ] Verify counts are correct
- [ ] Check browser console for any errors
- [ ] Confirm recent requests are displayed

## 🎉 Expected Result

User Admins can now properly view:
- Total requests managed by each user
- Requests currently in progress
- Completed requests
- List of 5 most recent requests with status badges
- Full request details when needed

The User Admin dashboard should now display accurate, complete information for user management purposes!

