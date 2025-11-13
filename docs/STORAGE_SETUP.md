# Supabase Storage Setup

This guide explains how to set up Supabase Storage for file uploads in the CSR Platform.

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name:** `request-files`
   - **Public bucket:** ✅ Enable (if you want public access to uploaded files)
     - OR ❌ Disable (if you want private files with signed URLs)
   - **File size limit:** Set as needed (e.g., 10MB)
   - **Allowed MIME types:** Leave empty for all types, or specify (e.g., `image/*,application/pdf`)
5. Click **"Create bucket"**

## Step 2: Configure Storage Policies (RLS)

If you made the bucket **private**, you need to set up Row Level Security policies:

1. Go to **Supabase Dashboard** → **Storage** → **Policies**
2. Select the `request-files` bucket from the dropdown
3. Click **New Policy** or use the **Policy Templates** dropdown

### Option 1: Use Policy Templates (Easiest) ⭐ Recommended

1. Click **Policy Templates** dropdown
2. Select **"Give users access to only their own top level folder named as uid"**
3. The policy will be pre-filled with SQL - click **"Use this template"**
4. Review the policy and click **Save policy**

**Note:** You'll need to create separate policies for INSERT, SELECT, and DELETE operations.

### Option 2: Create Custom Policies

**⚠️ Important: Create separate policies for each operation**

**Policy 1: Users can upload their own files**
- Click **New Policy**
- Policy name: `Users can upload own files`
- **Allowed operation:** ✅ Check **INSERT** only (uncheck others!)
- **Target roles:** Select `authenticated`
- Policy definition (paste this in the policy editor):
  ```
  bucket_id = 'request-files' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Click **Review** then **Save policy**

**Policy 2: Users can read their own files**
- Click **New Policy**
- Policy name: `Users can read own files`
- **Allowed operation:** ✅ Check **SELECT** only (uncheck others!)
- **Target roles:** Select `authenticated`
- Policy definition:
  ```
  bucket_id = 'request-files' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Click **Review** then **Save policy**

**Policy 3: Users can delete their own files** (Optional - if users need to delete)
- Click **New Policy**
- Policy name: `Users can delete own files`
- **Allowed operation:** ✅ Check **DELETE** only (uncheck others!)
- **Target roles:** Select `authenticated`
- Policy definition:
  ```
  bucket_id = 'request-files' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Click **Review** then **Save policy**

**Policy 4: Staff can read all files** (Optional - for CSR Reps and Platform Managers)
- Click **New Policy**
- Policy name: `Staff can read all files`
- **Allowed operation:** ✅ Check **SELECT** only (uncheck others!)
- **Target roles:** Select `authenticated`
- Policy definition:
  ```
  bucket_id = 'request-files' AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() 
    AND role IN ('csr-representative', 'platform-manager')
  )
  ```
- Click **Review** then **Save policy**

**Note:** 
- If you get a syntax error, make sure you're using the Policy Editor in the Supabase UI, not the SQL Editor. Storage policies must be created through the Storage → Policies interface.
- Only check ONE operation per policy for better management and flexibility.

## Step 3: Test File Upload

After setting up the bucket, test file uploads by:
1. Submitting a new request with an attachment
2. Checking the Storage → `request-files` bucket to see if files appear

## Troubleshooting

### Error: "Bucket not found"
- Make sure the bucket name is exactly `request-files` (case-sensitive)
- Verify the bucket exists in your Supabase project

### Error: "new row violates row-level security policy"
- If using a private bucket, make sure RLS policies are set up correctly
- Check that the user is authenticated and has the correct role

### Files not accessible
- If bucket is private, use signed URLs instead of public URLs:
  ```typescript
  const { data } = await supabase.storage
    .from("request-files")
    .createSignedUrl(fileName, 3600); // 1 hour expiry
  ```

