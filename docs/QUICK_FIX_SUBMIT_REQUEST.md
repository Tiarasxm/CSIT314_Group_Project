# Quick Fix for Submit Request Errors

You're seeing these errors because two things need to be set up:

## 1. Run Database Migration (Required)

The `additional_notes` column is missing. Run this migration:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/006_add_request_fields.sql`:
   ```sql
   -- Add additional fields to requests table for user interface
   ALTER TABLE requests
   ADD COLUMN IF NOT EXISTS category TEXT,
   ADD COLUMN IF NOT EXISTS additional_notes TEXT,
   ADD COLUMN IF NOT EXISTS attachments TEXT[];

   -- Update existing requests to have a default category if null
   UPDATE requests
   SET category = 'Household Support'
   WHERE category IS NULL;
   ```
3. Click **Run**

## 2. Create Storage Bucket (Optional - for file uploads)

If you want file uploads to work:

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Name: `request-files`
4. **Public bucket**: ✅ Enable (or disable if you want private files)
5. Click **"Create bucket"**

For detailed setup, see `STORAGE_SETUP.md`

## After Setup

Once both are done, try submitting a request again. The form will work even without the storage bucket (files just won't upload).

