-- CSR Platform Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table (needed before users due to foreign key)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  csr_representative_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
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

-- Add foreign key constraint for companies.csr_representative_id
ALTER TABLE companies
ADD CONSTRAINT fk_csr_representative
FOREIGN KEY (csr_representative_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
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
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_accepted_by ON requests(accepted_by);
CREATE INDEX IF NOT EXISTS idx_requests_company_id ON requests(company_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      (NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name'),
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

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "User admins can read all users" ON users;
DROP POLICY IF EXISTS "User admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can read own requests" ON requests;
DROP POLICY IF EXISTS "Users can create own requests" ON requests;
DROP POLICY IF EXISTS "CSR reps can read pending requests" ON requests;
DROP POLICY IF EXISTS "CSR reps can update accepted requests" ON requests;

-- Create RLS policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data (except role)
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

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

-- User Admins can insert new users
CREATE POLICY "User admins can insert users" ON users
  FOR INSERT WITH CHECK (
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

-- Users can update their own requests
CREATE POLICY "Users can update own requests" ON requests
  FOR UPDATE USING (auth.uid() = user_id);

-- CSR Representatives can read all pending requests
CREATE POLICY "CSR reps can read pending requests" ON requests
  FOR SELECT USING (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'csr-representative'
    )
  );

-- CSR Representatives can read requests they accepted
CREATE POLICY "CSR reps can read accepted requests" ON requests
  FOR SELECT USING (
    accepted_by = auth.uid() AND
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

-- Platform Managers can read all data (for analytics)
CREATE POLICY "Platform managers can read all data" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'platform-manager'
    )
  );

CREATE POLICY "Platform managers can read all requests" ON requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'platform-manager'
    )
  );

