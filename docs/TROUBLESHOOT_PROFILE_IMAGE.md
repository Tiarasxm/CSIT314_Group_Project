# Troubleshooting Profile Image Not Displaying

If your uploaded profile image is not displaying, follow these steps:

## Step 1: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab for:
- Any error messages
- The debug logs we added:
  - "Profile image URL loaded: [url]"
  - "Uploaded file path: [path]"
  - "Public URL generated: [url]"
  - "Profile image URL saved to database: [url]"
  - "Failed to load profile image: [url]" (if there's an error)

## Step 2: Verify Database Column Exists

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query to check if the column exists:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'profile_image_url';
   ```
3. If no results, run the migration:
   ```sql
   ALTER TABLE users
   ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
   ```

## Step 3: Verify Storage Bucket Setup

1. Go to **Supabase Dashboard** → **Storage**
2. Check that `profile-images` bucket exists
3. Verify it's set to **Public bucket** (should be enabled)
4. Check that files are actually uploaded:
   - Go to **Storage** → **profile-images**
   - You should see folders with user IDs containing image files

## Step 4: Verify Storage Policies

1. Go to **Storage** → **Policies** → Select `profile-images` bucket
2. Ensure you have a **SELECT** policy that allows reading:
   - Policy name: `Profile images are publicly readable`
   - Operation: **SELECT**
   - Target roles: Leave default (or select `anon` and `authenticated`)
   - Policy definition: `bucket_id = 'profile-images'`

## Step 5: Test Image URL Directly

1. In the browser console, copy the profile image URL that was logged
2. Paste it directly in a new browser tab
3. If you see a 403 Forbidden or 404 Not Found:
   - The SELECT policy is missing or incorrect
   - The bucket is not public
   - The file path is incorrect

## Step 6: Check Image URL Format

The URL should look like:
```
https://[your-project].supabase.co/storage/v1/object/public/profile-images/[user-id]/[filename]
```

If it looks different, there might be an issue with how the URL is generated.

## Step 7: Verify RLS on Users Table

Make sure users can read their own `profile_image_url`:
1. Go to **Database** → **Tables** → **users** → **Policies**
2. Ensure there's a policy like "Users can read own data" that includes `profile_image_url`

## Common Issues and Solutions

### Issue: "Failed to load profile image" in console
**Solution:** 
- Check that the SELECT policy exists and allows public access
- Verify the bucket is public
- Check the image URL is correct

### Issue: Image uploads but doesn't display
**Solution:**
- Check if `profile_image_url` column exists in database
- Verify the URL is saved correctly (check console logs)
- Refresh the page after upload

### Issue: 403 Forbidden when accessing image URL
**Solution:**
- Create/update the SELECT policy to allow public read access
- Ensure bucket is set to public

### Issue: Image shows briefly then disappears
**Solution:**
- Check the `onError` handler in the code
- Verify the image URL is valid and accessible
- Check CORS settings in Supabase

## Quick Test

1. Upload an image
2. Check console for the generated URL
3. Copy the URL and open it in a new tab
4. If it loads, the issue is in the React component
5. If it doesn't load, the issue is with storage policies or bucket settings

