-- Fix handle_new_user() trigger to properly handle NULL values
-- This fixes the "operator does not exist: text ->> unknown" error

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      CASE 
        WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL 
         AND NEW.raw_user_meta_data->>'last_name' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name')
        WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL 
        THEN NEW.raw_user_meta_data->>'first_name'
        WHEN NEW.raw_user_meta_data->>'last_name' IS NOT NULL 
        THEN NEW.raw_user_meta_data->>'last_name'
        ELSE 'User'
      END,
      'User'
    ),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was updated
SELECT 'handle_new_user() trigger function updated successfully!' as status;

