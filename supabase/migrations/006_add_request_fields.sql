-- Add additional fields to requests table for user interface
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS attachments TEXT[];

-- Update existing requests to have a default category if null
UPDATE requests
SET category = 'Household Support'
WHERE category IS NULL;

