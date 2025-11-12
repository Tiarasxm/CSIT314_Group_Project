# Troubleshooting Request Withdrawal

If you're getting errors when trying to withdraw a pending request, follow these steps:

## Step 1: Run the DELETE Policy Migration

The most common issue is that the DELETE policy hasn't been created yet. Run this migration in your Supabase SQL Editor:

```sql
-- Allow users to delete their own pending requests
DROP POLICY IF EXISTS "Users can delete own pending requests" ON requests;

CREATE POLICY "Users can delete own pending requests" ON requests
  FOR DELETE 
  USING (
    auth.uid() = user_id AND 
    status = 'pending'
  );
```

Or run the migration file: `supabase/migrations/010_allow_users_delete_pending_requests.sql`

## Step 2: Verify the Policy Exists

Check if the policy was created:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'requests' AND policyname = 'Users can delete own pending requests';
```

You should see a row with `cmd = 'DELETE'`.

## Step 3: Check Browser Console

After clicking "Withdraw Request" and confirming, check the browser console for:
- Any error messages
- The detailed error object (it will be logged with `JSON.stringify`)

Common errors:
- **"new row violates row-level security policy"**: The DELETE policy is missing or incorrect
- **"No rows returned"**: The request was already deleted or doesn't exist
- **"permission denied"**: The RLS policy is blocking the deletion

## Step 4: Verify Request Status

Make sure the request status is exactly `'pending'` (case-sensitive). The policy only allows deletion of pending requests.

## Step 5: Test the Policy Directly

You can test if the policy works by running this in Supabase SQL Editor (replace with your user ID and request ID):

```sql
-- First, get your user ID
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Then check if you can see the request
SELECT id, status, user_id 
FROM requests 
WHERE id = 'your-request-id' AND user_id = 'your-user-id';

-- The DELETE should work if:
-- 1. The request exists
-- 2. user_id matches your auth.uid()
-- 3. status = 'pending'
```

## Common Issues and Solutions

### Issue: "new row violates row-level security policy"
**Solution**: 
- Run the migration `010_allow_users_delete_pending_requests.sql`
- Verify the policy exists using the query in Step 2
- Make sure you're logged in as the correct user

### Issue: Request not found after deletion
**Solution**: 
- This is expected! The request was successfully deleted
- The console error about "No rows" is normal after deletion
- The code now handles this gracefully and redirects

### Issue: Delete succeeds but files remain in storage
**Solution**:
- File deletion is best-effort (continues even if file deletion fails)
- You can manually clean up files in Supabase Storage if needed
- This doesn't prevent the request from being deleted

### Issue: Can't delete non-pending requests
**Solution**:
- This is by design! Only pending requests can be withdrawn
- Once a request is accepted/confirmed, it cannot be deleted by the user

## Quick Test

1. Create a test pending request
2. Try to withdraw it
3. Check browser console for any errors
4. Verify the request is removed from the requests list
5. Check Supabase Storage to see if files were deleted (optional)

