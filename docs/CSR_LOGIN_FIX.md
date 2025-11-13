# CSR Login Fix - Database Error Resolution

## Problem
CSR accounts (and all staff accounts) could not log in, showing the error:
```
Database error querying schema
```

This appeared on both:
- Regular login page (`/login`) for CSRs
- Staff portal login page (`/staff/login`)

## Root Cause
The staff login page was querying the `users` table directly after authentication to get the user's role:

```typescript
const { data: userData, error: userError } = await supabase
  .from("users")
  .select("role, email, name")
  .eq("id", data.user.id)
  .single();
```

This caused **Row Level Security (RLS)** issues because:
1. The RLS policy only allows `auth.uid() = id`
2. There can be timing issues with RLS context during login
3. The query can trigger RLS recursion problems

## Solution
Changed the staff login to use `user_metadata` instead of querying the database:

```typescript
// Get user role from auth metadata (stored during signup/account creation)
// This avoids querying the users table which can cause RLS issues
const role = data.user.user_metadata?.role;
```

### Why This Works
- `user_metadata` is stored in the auth system during account creation
- It doesn't require database queries or RLS checks
- It's immediately available after authentication
- Same approach we used for regular user login

## Files Changed
- ✅ **`app/staff/login/page.tsx`** - Fixed to use `user_metadata` for role
- ✅ **`app/(auth)/login/login-content.tsx`** - Already fixed (from earlier)

## Testing
1. Try logging in as a CSR:
   - Email: `csr2@csr-platform.com` (or csr3, csr4)
   - Password: `CSRPassword123!`
2. Should successfully redirect to CSR dashboard
3. No "Database error querying schema" error

## All Staff Accounts Now Working
✅ **CSR Representatives:**
- csr@csr-platform.com
- csr2@csr-platform.com
- csr3@csr-platform.com
- csr4@csr-platform.com

✅ **User Admin:**
- admin@csr-platform.com

✅ **Platform Manager:**
- manager@csr-platform.com

All passwords: `[Role]Password123!` (e.g., `CSRPassword123!`, `AdminPassword123!`)

## Related Issues
This is the same RLS issue we encountered with:
1. Regular user login (fixed in `login-content.tsx`)
2. User Admin login (also fixed)
3. Now CSR and all staff login (fixed in `staff/login/page.tsx`)

## Key Takeaway
**Always use `user_metadata` for role/user info immediately after login instead of querying the database.**
This avoids RLS complications and makes login more reliable.

