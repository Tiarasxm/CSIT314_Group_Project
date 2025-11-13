-- BULLETPROOF demo data script using UPSERT
-- Run this as many times as you want - it will update existing records

DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  user3_id UUID := '33333333-3333-3333-3333-333333333333';
  user4_id UUID := '44444444-4444-4444-4444-444444444444';
  csr1_id UUID;
  request_count INT;
  random_status TEXT;
  random_category TEXT;
  random_date TIMESTAMP;
BEGIN
  -- Clean up old requests only (we'll UPSERT users)
  DELETE FROM requests WHERE user_id IN (user1_id, user2_id, user3_id, user4_id);
  
  -- Get CSR ID
  SELECT id INTO csr1_id FROM users WHERE role = 'csr-representative' LIMIT 1;

  -- UPSERT User 1: John Smith
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
  ) VALUES (
    user1_id, '00000000-0000-0000-0000-000000000000', 'john.smith@demo.com',
    crypt('DemoUser123!', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "John Smith", "first_name": "John", "last_name": "Smith", "role": "user"}',
    NOW(), NOW(), 'authenticated', 'authenticated'
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

  INSERT INTO public.users (id, email, name, first_name, last_name, role, contact_number, gender, date_of_birth, is_suspended)
  VALUES (user1_id, 'john.smith@demo.com', 'John Smith', 'John', 'Smith', 'user', '91234567', 'Male', '1990-05-15', false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

  -- UPSERT User 2: Sarah Johnson
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
  ) VALUES (
    user2_id, '00000000-0000-0000-0000-000000000000', 'sarah.johnson@demo.com',
    crypt('DemoUser123!', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Sarah Johnson", "first_name": "Sarah", "last_name": "Johnson", "role": "user"}',
    NOW(), NOW(), 'authenticated', 'authenticated'
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

  INSERT INTO public.users (id, email, name, first_name, last_name, role, contact_number, gender, date_of_birth, is_suspended)
  VALUES (user2_id, 'sarah.johnson@demo.com', 'Sarah Johnson', 'Sarah', 'Johnson', 'user', '92345678', 'Female', '1985-08-22', false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

  -- UPSERT User 3: Michael Chen
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
  ) VALUES (
    user3_id, '00000000-0000-0000-0000-000000000000', 'michael.chen@demo.com',
    crypt('DemoUser123!', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Michael Chen", "first_name": "Michael", "last_name": "Chen", "role": "user"}',
    NOW(), NOW(), 'authenticated', 'authenticated'
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

  INSERT INTO public.users (id, email, name, first_name, last_name, role, contact_number, gender, date_of_birth, is_suspended)
  VALUES (user3_id, 'michael.chen@demo.com', 'Michael Chen', 'Michael', 'Chen', 'user', '93456789', 'Male', '1992-11-30', false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

  -- UPSERT User 4: Emily Rodriguez
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
  ) VALUES (
    user4_id, '00000000-0000-0000-0000-000000000000', 'emily.rodriguez@demo.com',
    crypt('DemoUser123!', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Emily Rodriguez", "first_name": "Emily", "last_name": "Rodriguez", "role": "user"}',
    NOW(), NOW(), 'authenticated', 'authenticated'
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

  INSERT INTO public.users (id, email, name, first_name, last_name, role, contact_number, gender, date_of_birth, is_suspended)
  VALUES (user4_id, 'emily.rodriguez@demo.com', 'Emily Rodriguez', 'Emily', 'Rodriguez', 'user', '94567890', 'Female', '1988-03-18', false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

  RAISE NOTICE '✅ Upserted 4 demo users';

  -- Create 100 fresh requests
  FOR i IN 1..100 LOOP
    DECLARE
      random_user_id UUID;
      random_user_array UUID[] := ARRAY[user1_id, user2_id, user3_id, user4_id];
    BEGIN
      random_user_id := random_user_array[1 + floor(random() * 4)::int];
      random_category := (ARRAY['Household Support', 'Transportation', 'Medical Assistance', 'Food & Groceries', 'Technology Support', 'Other'])[1 + floor(random() * 6)::int];
      
      CASE floor(random() * 10)::int
        WHEN 0, 1 THEN random_status := 'pending';
        WHEN 2, 3, 4 THEN random_status := 'accepted';
        WHEN 5, 6, 7 THEN random_status := 'completed';
        ELSE random_status := 'cancelled';
      END CASE;
      
      random_date := NOW() - (random() * INTERVAL '90 days');
      
      INSERT INTO requests (
        user_id, title, category, description, preferred_at,
        location, status, created_at, updated_at, accepted_by,
        volunteer_name, volunteer_mobile, volunteer_note
      ) VALUES (
        random_user_id,
        CASE random_category
          WHEN 'Household Support' THEN (ARRAY['Help with cleaning', 'Furniture moving assistance', 'Minor home repairs', 'Gardening help', 'Decluttering support'])[1 + floor(random() * 5)::int]
          WHEN 'Transportation' THEN (ARRAY['Ride to hospital appointment', 'Grocery shopping transport', 'Pharmacy pickup', 'Airport drop-off', 'Weekly market trip'])[1 + floor(random() * 5)::int]
          WHEN 'Medical Assistance' THEN (ARRAY['Accompany to doctor visit', 'Medication reminder help', 'Physical therapy support', 'Medical equipment setup', 'Health monitoring check'])[1 + floor(random() * 5)::int]
          WHEN 'Food & Groceries' THEN (ARRAY['Weekly grocery shopping', 'Meal preparation help', 'Food delivery assistance', 'Dietary planning support', 'Cooking lessons'])[1 + floor(random() * 5)::int]
          WHEN 'Technology Support' THEN (ARRAY['Computer setup help', 'Smartphone training', 'Internet connection fix', 'Online banking setup', 'Video call assistance'])[1 + floor(random() * 5)::int]
          ELSE (ARRAY['Companionship visit', 'Pet care assistance', 'Mail collection', 'Bill payment help', 'Document reading support'])[1 + floor(random() * 5)::int]
        END,
        random_category,
        CASE floor(random() * 5)::int
          WHEN 0 THEN 'I need assistance with this task as soon as possible. Any help would be greatly appreciated.'
          WHEN 1 THEN 'Looking for someone reliable to help me with this. I am flexible with timing.'
          WHEN 2 THEN 'This is quite urgent and I would really appreciate prompt assistance. Thank you!'
          WHEN 3 THEN 'I have limited mobility and could really use some help with this task.'
          ELSE 'Regular assistance needed. Please let me know if you can help. Thanks in advance!'
        END,
        random_date + INTERVAL '7 days',
        (ARRAY['Ang Mo Kio', 'Bedok', 'Bishan', 'Clementi', 'Hougang', 'Jurong West', 'Pasir Ris', 'Punggol', 'Sengkang', 'Tampines', 'Toa Payoh', 'Woodlands', 'Yishun'])[1 + floor(random() * 13)::int],
        random_status,
        random_date,
        random_date,
        CASE WHEN random_status IN ('accepted', 'completed') THEN csr1_id ELSE NULL END,
        CASE WHEN random_status IN ('accepted', 'completed') THEN (ARRAY['David Wong', 'Lisa Tan', 'Kevin Lim', 'Rachel Lee', 'Andrew Ng'])[1 + floor(random() * 5)::int] ELSE NULL END,
        CASE WHEN random_status IN ('accepted', 'completed') THEN (ARRAY['98765432', '97654321', '96543210', '95432109', '94321098'])[1 + floor(random() * 5)::int] ELSE NULL END,
        CASE WHEN random_status IN ('accepted', 'completed') THEN 'I will be happy to assist you with this request. Please let me know if you have any special requirements.' ELSE NULL END
      );
    END;
  END LOOP;

  GET DIAGNOSTICS request_count = ROW_COUNT;

  RAISE NOTICE '✅ Created 100 demo requests';
  RAISE NOTICE '📧 Login: john.smith@demo.com | sarah.johnson@demo.com | michael.chen@demo.com | emily.rodriguez@demo.com';
  RAISE NOTICE '🔑 Password: DemoUser123!';
  
END $$;

-- Verify
SELECT 'Demo Users' as type, COUNT(*) as count FROM users WHERE email LIKE '%@demo.com'
UNION ALL
SELECT 'Demo Requests' as type, COUNT(*) as count FROM requests WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@demo.com');

