-- Add shortlisted_by column to track which CSR representative shortlisted a request

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS shortlisted_by UUID;

CREATE INDEX IF NOT EXISTS idx_requests_shortlisted_by ON requests(shortlisted_by);

