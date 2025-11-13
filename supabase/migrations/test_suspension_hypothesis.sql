-- TEST: Temporarily set one non-working CSR to suspended
-- to see if that makes it work
UPDATE users
SET is_suspended = true
WHERE email = 'csr2@csr-platform.com';

-- Verify the change
SELECT email, is_suspended, role
FROM users
WHERE email IN (
  'csr.representative@csr-platform.com',
  'csr2@csr-platform.com'
)
ORDER BY email;
