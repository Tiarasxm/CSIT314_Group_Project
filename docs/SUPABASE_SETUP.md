# Supabase Setup Guide

This guide will help you set up Supabase for the CSR Platform project.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in your project details:
   - **Name:** CSR Platform
   - **Database Password:** (Generate a strong password and save it securely)
   - **Region:** Choose the closest region to your users
5. Click "Create new project"

## Step 2: Get Your API Keys

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:

### Project URL
```
https://your-project-id.supabase.co
```

### Anon/Public Key (Safe to expose in client-side code)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk2ODAwLCJleHAiOjE5NTY1NzI4MDB9.example-anon-key
```

### Service Role Key (Keep secret! Server-side only)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTY4MDAsImV4cCI6MTk1NjU3MjgwMH0.example-service-role-key
```

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root of your project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk2ODAwLCJleHAiOjE5NTY1NzI4MDB9.example-anon-key

# Server-side only (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTY4MDAsImV4cCI6MTk1NjU3MjgwMH0.example-service-role-key
```

⚠️ **Important:** 
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- The `NEXT_PUBLIC_*` variables are safe to expose in client-side code
- The `SUPABASE_SERVICE_ROLE_KEY` should NEVER be exposed to the client

## Step 4: Set Up Database Schema

Run the following SQL in your Supabase SQL Editor (Dashboard → SQL Editor):

### Create Users Table

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('platform-manager', 'user-admin', 'csr-representative', 'user')),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  csr_representative_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in-progress', 'completed', 'cancelled')),
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  preferred_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_accepted_by ON requests(accepted_by);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data (except role)
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- User Admins can read all users
CREATE POLICY "User admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'user-admin'
    )
  );

-- User Admins can update all users
CREATE POLICY "User admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'user-admin'
    )
  );

-- Users can read their own requests
CREATE POLICY "Users can read own requests" ON requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own requests" ON requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CSR Representatives can read all pending requests
CREATE POLICY "CSR reps can read pending requests" ON requests
  FOR SELECT USING (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'csr-representative'
    )
  );

-- CSR Representatives can update requests they accept
CREATE POLICY "CSR reps can update accepted requests" ON requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'csr-representative'
    )
  );
```

## Step 5: Create Pre-Set Authority Accounts

After setting up the schema, create the pre-set authority accounts. You can do this through the Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. For each account (see `PRE_SET_ACCOUNTS.md`):
   - Enter the email
   - Enter the password
   - Click **Create user**
   - After creation, note the user ID
   - Update the user's metadata or directly update the `users` table with the correct role

Or use the SQL Editor to update roles after creating auth users:

```sql
-- Update user roles (replace <user_id> with actual IDs from auth.users)
UPDATE users 
SET role = 'platform-manager' 
WHERE email = 'platform.manager@csr-platform.com';

UPDATE users 
SET role = 'user-admin' 
WHERE email = 'user.admin@csr-platform.com';

UPDATE users 
SET role = 'csr-representative' 
WHERE email = 'csr.representative@csr-platform.com';
```

## Step 6: Configure Site URL and Redirect URLs

**IMPORTANT:** This fixes email confirmation links!

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**:
   - For development: `http://localhost:3000`
   - For production: `https://your-production-domain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/login`
   - `http://localhost:3000/register`
   - For production, add your production URLs too
4. Click **Save**

## Step 7: Configure Authentication Providers

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (already enabled by default)
3. To enable **Google OAuth**:
   - Enable Google provider
   - Add your Google OAuth credentials:
     - Client ID
     - Client Secret
   - Add authorized redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `https://your-production-domain.com/auth/callback`

## Step 8: Test Your Setup

1. Start your development server: `npm run dev`
2. Try registering a new user at `/register`
3. Try logging in with a pre-set account at `/staff/login`
4. Verify that users are created in both `auth.users` and `public.users` tables

## Security Best Practices

1. ✅ **Never expose** `SUPABASE_SERVICE_ROLE_KEY` in client-side code
2. ✅ Use Row Level Security (RLS) policies to protect data
3. ✅ Regularly rotate your service role key
4. ✅ Use strong passwords for pre-set accounts in production
5. ✅ Enable email confirmation for new user registrations
6. ✅ Set up rate limiting for authentication endpoints
7. ✅ Monitor authentication logs for suspicious activity

## Troubleshooting

### Issue: Users not appearing in `users` table after signup
- Check that the `handle_new_user()` trigger is created and enabled
- Verify the trigger function has proper permissions

### Issue: RLS policies blocking queries
- Check that you're authenticated when making queries
- Verify your RLS policies match your use case
- Temporarily disable RLS for testing (NOT recommended for production)

### Issue: Google OAuth not working
- Verify redirect URLs are correctly configured
- Check that Google OAuth credentials are valid
- Ensure callback URL matches exactly (including protocol and port)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js with Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

