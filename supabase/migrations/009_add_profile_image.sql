-- Add profile image column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

