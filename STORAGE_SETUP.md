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

1. Go to **Storage** → **Policies** → Select `request-files` bucket
2. Create policies to allow:
   - **Users can upload their own files:**
     ```sql
     CREATE POLICY "Users can upload own files"
     ON storage.objects FOR INSERT
     WITH CHECK (
       bucket_id = 'request-files' AND
       auth.uid()::text = (storage.foldername(name))[1]
     );
     ```
   
   - **Users can read their own files:**
     ```sql
     CREATE POLICY "Users can read own files"
     ON storage.objects FOR SELECT
     USING (
       bucket_id = 'request-files' AND
       auth.uid()::text = (storage.foldername(name))[1]
     );
     ```

   - **CSR Reps and Platform Managers can read all files:**
     ```sql
     CREATE POLICY "Staff can read all files"
     ON storage.objects FOR SELECT
     USING (
       bucket_id = 'request-files' AND
       EXISTS (
         SELECT 1 FROM users
         WHERE id = auth.uid() 
         AND role IN ('csr-representative', 'platform-manager')
       )
     );
     ```

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

