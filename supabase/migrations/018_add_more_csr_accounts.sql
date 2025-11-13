-- Add 3 more CSR Representative accounts
-- These accounts can be used for testing and demonstration purposes

-- Generate UUIDs for the new CSR accounts
DO $$
DECLARE
  csr_rep_2_id UUID := gen_random_uuid();
  csr_rep_3_id UUID := gen_random_uuid();
  csr_rep_4_id UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users (Supabase authentication)
  -- Include role in raw_user_meta_data from the start to work with trigger
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES 
    (
      csr_rep_2_id,
      '00000000-0000-0000-0000-000000000000',
      'csr2@csr-platform.com',
      crypt('CSRPassword123!', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Sarah Johnson", "first_name": "Sarah", "last_name": "Johnson", "role": "csr-representative"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    ),
    (
      csr_rep_3_id,
      '00000000-0000-0000-0000-000000000000',
      'csr3@csr-platform.com',
      crypt('CSRPassword123!', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Michael Chen", "first_name": "Michael", "last_name": "Chen", "role": "csr-representative"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    ),
    (
      csr_rep_4_id,
      '00000000-0000-0000-0000-000000000000',
      'csr4@csr-platform.com',
      crypt('CSRPassword123!', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Emily Rodriguez", "first_name": "Emily", "last_name": "Rodriguez", "role": "csr-representative"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    )
  ON CONFLICT (id) DO NOTHING;

  -- The handle_new_user() trigger automatically creates records in public.users
  -- when inserting into auth.users, using the raw_user_meta_data
  
  -- Just ensure the public.users records have the correct role
  -- (in case trigger didn't fire or needs update)
  UPDATE users
  SET role = 'csr-representative'
  WHERE id IN (csr_rep_2_id, csr_rep_3_id, csr_rep_4_id);

END $$;

-- Verify the accounts were created
SELECT 
  u.email,
  u.name,
  u.role,
  u.created_at
FROM users u
WHERE u.role = 'csr-representative'
ORDER BY u.created_at DESC;

