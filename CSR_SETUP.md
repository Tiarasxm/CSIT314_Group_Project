# CSR Representative Setup Guide

This guide explains how to set up the CSR Representative functionality, including the database migration and storage bucket for volunteer images.

## Step 1: Run Database Migration

Run the migration to add volunteer assignment fields to the requests table:

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/011_add_volunteer_assignment_fields.sql`
3. Click **Run**

This migration adds:
- `volunteer_name` - Name of the assigned volunteer
- `volunteer_mobile` - Mobile number of the volunteer
- `volunteer_note` - Notes about the volunteer assignment
- `volunteer_image_url` - URL to the volunteer's image
- `shortlisted` - Boolean flag for shortlisted requests

## Step 2: Create Storage Bucket for Volunteer Images

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `volunteer-images`
4. **Public bucket**: ✅ (checked) - This allows public access to images
5. Click **Create bucket**

## Step 3: Set Up Storage Policies

For the `volunteer-images` bucket, create the following policies via the Storage UI:

### Policy 1: Allow CSR Reps to Upload Images (INSERT)
- **Policy name**: "CSR reps can upload volunteer images"
- **Allowed operation**: INSERT
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'volunteer-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'csr-representative'
  )
  ```

### Policy 2: Allow Public Read (SELECT)
- **Policy name**: "Public can read volunteer images"
- **Allowed operation**: SELECT
- **Target roles**: `public` (or leave default)
- **Policy definition**:
  ```sql
  bucket_id = 'volunteer-images'
  ```

### Policy 3: Allow CSR Reps to Delete Images (DELETE)
- **Policy name**: "CSR reps can delete volunteer images"
- **Allowed operation**: DELETE
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'volunteer-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'csr-representative'
  )
  ```

## CSR Representative Features

### Dashboard
- View statistics for:
  - New Requests (pending)
  - Active Assignments (accepted/in-progress)
  - My Shortlists (shortlisted requests)
  - Completed Services

### New Requests Page
- View all pending requests
- **Assign**: Assign a volunteer to a request (with confirmation modal)
- **Shortlist**: Add request to shortlist
- **Export**: Export request as PDF (to be implemented)
- Search functionality

### My Shortlist Page
- View all shortlisted requests
- **Assign CV**: Assign a volunteer to a shortlisted request
- **Export**: Export request as PDF

### Active Assignments Page
- View all assigned requests (accepted/in-progress status)
- **Edit Volunteer**: Update volunteer name, mobile, note, or image
- Search functionality

### Completed Services Page
- View all completed requests
- Filter by category and time range
- Search functionality
- **Export**: Export request as PDF

## Assign Volunteer Modal

When assigning or editing a volunteer, the CSR rep must provide:
- **Name** (required)
- **Mobile number** (optional)
- **Note** (required)
- **Image** (optional)

The modal includes:
- Image upload with preview
- Image removal
- Form validation
- Confirmation before saving

## Notes

- CSR reps can shortlist requests before or after assigning them
- Once assigned, CSR reps can edit volunteer information
- Volunteer images are stored in the `volunteer-images` storage bucket
- PDF export functionality is marked as TODO and will be implemented separately

