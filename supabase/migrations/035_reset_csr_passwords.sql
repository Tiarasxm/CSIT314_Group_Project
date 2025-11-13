-- Reset passwords for the 3 new CSR accounts
-- CHOOSE ONE OF THE TWO OPTIONS BELOW:

-- =======================
-- OPTION 1: Use CSRRep2024! (Same as original CSR account)
-- =======================
-- Uncomment these lines to use the same password as csr.representative@csr-platform.com

/*
UPDATE auth.users
SET encrypted_password = crypt('CSRRep2024!', gen_salt('bf'))
WHERE email IN (
  'csr2@csr-platform.com',
  'csr3@csr-platform.com',
  'csr4@csr-platform.com'
);
*/

-- =======================
-- OPTION 2: Use CSRPassword123! (As originally intended)
-- =======================
-- Uncomment these lines to use CSRPassword123!

UPDATE auth.users
SET encrypted_password = crypt('CSRPassword123!', gen_salt('bf'))
WHERE email IN (
  'csr2@csr-platform.com',
  'csr3@csr-platform.com',
  'csr4@csr-platform.com'
);

-- =======================
-- Verification
-- =======================

-- Check if accounts exist
SELECT 
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as email_confirmed,
  'Password has been reset!' as note
FROM auth.users
WHERE email IN (
  'csr2@csr-platform.com',
  'csr3@csr-platform.com',
  'csr4@csr-platform.com'
)
ORDER BY email;

-- If no rows returned, accounts don't exist and need to be created first
-- Run migration 018_add_more_csr_accounts.sql first if accounts don't exist

