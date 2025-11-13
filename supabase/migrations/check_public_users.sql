-- Check if CSR accounts exist in public.users table
SELECT 
  au.email as auth_email,
  u.id as public_id,
  u.email as public_email,
  u.role as public_role,
  u.is_suspended,
  CASE 
    WHEN u.email IS NULL THEN '❌ MISSING FROM public.users!'
    WHEN au.email = 'csr.representative@csr-platform.com' THEN '✅ WORKING'
    ELSE '❓ EXISTS BUT NOT WORKING'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email IN (
  'csr.representative@csr-platform.com',
  'csr2@csr-platform.com',
  'csr3@csr-platform.com',
  'csr4@csr-platform.com',
  'test.csr@csr-platform.com'
)
ORDER BY 
  CASE 
    WHEN au.email = 'csr.representative@csr-platform.com' THEN 1
    ELSE 2
  END;
