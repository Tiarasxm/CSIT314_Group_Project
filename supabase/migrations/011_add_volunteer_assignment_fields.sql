-- Add volunteer assignment fields to requests table
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS volunteer_name TEXT,
ADD COLUMN IF NOT EXISTS volunteer_mobile TEXT,
ADD COLUMN IF NOT EXISTS volunteer_note TEXT,
ADD COLUMN IF NOT EXISTS volunteer_image_url TEXT,
ADD COLUMN IF NOT EXISTS shortlisted BOOLEAN DEFAULT FALSE;

-- Create index for shortlisted requests
CREATE INDEX IF NOT EXISTS idx_requests_shortlisted ON requests(shortlisted);

-- Update RLS policies to allow CSR reps to update volunteer assignment fields
-- (The existing "CSR reps can update accepted requests" policy should cover this)

