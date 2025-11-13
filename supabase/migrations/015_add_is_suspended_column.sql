-- Add is_suspended column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended);

-- Add comment
COMMENT ON COLUMN users.is_suspended IS 'Indicates if the user account is suspended by User Admin';

