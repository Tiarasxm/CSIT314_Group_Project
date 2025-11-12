# Profile Image Setup

This guide explains how to set up the profile image upload feature.

## Database Migration

Run the following migration in your Supabase SQL Editor:

```sql
-- Add profile image column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
```

Or run the migration file: `supabase/migrations/009_add_profile_image.sql`

## Storage Bucket Setup

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New bucket**
3. Name: `profile-images`
4. **Public bucket**: ✅ Enable (check this box)
5. Click **Create bucket**

## Storage Policies (RLS)

After creating the bucket, you need to set up storage policies through the Supabase UI:

1. Go to **Supabase Dashboard** → **Storage** → **Policies**
2. Select the `profile-images` bucket from the dropdown
3. Click **New Policy** or use the **Policy Templates** dropdown

### Option 1: Use Policy Templates (Easiest) ⭐ Recommended

1. Click **Policy Templates** dropdown
2. Select **"Give users access to only their own top level folder named as uid"**
3. The policy will be pre-filled with SQL - click **"Use this template"**
4. Review the policy and click **Save policy**

**Note:** You'll need to create **3 separate policies** (one for each operation):

**⚠️ Important: Create 3 SEPARATE policies (one per operation)**

**Policy 1: INSERT (Upload)**
- **Policy name:** `Users can upload their own profile images`
- **Allowed operation:** ✅ Check **INSERT** only (uncheck others!)
- **Target roles:** Select `authenticated`
- **Policy definition:** `bucket_id = 'profile-images' AND (select auth.uid()::text) = (storage.foldername(name))[1]`

**Policy 2: SELECT (Read/View)**
- **Policy name:** `Profile images are publicly readable`
- **Allowed operation:** ✅ Check **SELECT** only (uncheck others!)
- **Target roles:** Leave as default (or select both `anon` and `authenticated` for public viewing)
- **Policy definition:** `bucket_id = 'profile-images'` (simpler - allows anyone to view)

**Policy 3: DELETE**
- **Policy name:** `Users can delete their own profile images`
- **Allowed operation:** ✅ Check **DELETE** only (uncheck others!)
- **Target roles:** Select `authenticated`
- **Policy definition:** `bucket_id = 'profile-images' AND (select auth.uid()::text) = (storage.foldername(name))[1]`

**❌ Don't combine operations in one policy!** While it might work, separate policies are:
- Easier to manage and debug
- More flexible (e.g., SELECT can be public while INSERT/DELETE are authenticated-only)
- Follow Supabase best practices

**Why not UPDATE?**
In Supabase Storage, files are **immutable** (can't be changed in place). To "update" a profile image:
1. User uploads a new image (INSERT operation)
2. Old image is automatically deleted (DELETE operation)
3. New image URL is saved to the database

So UPDATE is not needed - INSERT + DELETE handle profile image changes perfectly!

**Target Roles Explained:**
- **Leave as default** = Policy applies to all roles (including anonymous/public users)
- **Select `authenticated`** = Only logged-in users can perform this operation
- **Select `anon`** = Only anonymous/public users (not logged in)
- For profile images:
  - **INSERT/DELETE:** Should be `authenticated` (only logged-in users)
  - **SELECT:** Can be default/public (so profile images are viewable by anyone)

**What the template generates:**
The template will create SQL like this:
```sql
bucket_id = 'profile-images' AND (select auth.uid()::text) = (storage.foldername(name))[1]
```

This is correct! It ensures:
- Files are in the `profile-images` bucket
- The folder name matches the user's UUID (so users can only access their own folder)

**Optional:** You can simplify it to (both work the same):
```sql
bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]
```

For the **SELECT** policy, since your bucket is public, you can either:
- Use the same template (users can read their own images), or
- Create a simpler SELECT policy with just `bucket_id = 'profile-images'` to allow public read access

### Option 2: Create Custom Policies

**Policy 1: Users can upload their own profile images**
- Click **New Policy**
- Policy name: `Users can upload their own profile images`
- Allowed operation: `INSERT`
- Policy definition (paste this in the policy editor):
  ```
  bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Click **Review** then **Save policy**

**Policy 2: Profile images are publicly readable**
- Click **New Policy**
- Policy name: `Profile images are publicly readable`
- Allowed operation: `SELECT`
- Policy definition:
  ```
  bucket_id = 'profile-images'
  ```
- Click **Review** then **Save policy**

**Policy 3: Users can delete their own profile images**
- Click **New Policy**
- Policy name: `Users can delete their own profile images`
- Allowed operation: `DELETE`
- Policy definition:
  ```
  bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Click **Review** then **Save policy**

## Usage

Once set up, users can:
1. Click the edit icon on their profile picture
2. Select an image file (max 5MB)
3. The image will be uploaded and displayed immediately
4. Old images are automatically deleted when a new one is uploaded

