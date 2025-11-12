/**
 * Diagnostic script to check if admin accounts are set up correctly
 * 
 * Usage: node scripts/check-admin-accounts.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const envFile = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return env;
  } catch (error) {
    console.error('Could not load .env.local file');
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminEmails = [
  'platform.manager@csr-platform.com',
  'user.admin@csr-platform.com',
  'csr.representative@csr-platform.com'
];

async function checkAdminAccounts() {
  console.log('🔍 Checking admin accounts setup...\n');

  // Check if users table exists
  const { data: tableCheck, error: tableError } = await supabaseAdmin
    .from('users')
    .select('id')
    .limit(1);

  if (tableError) {
    console.error('❌ ERROR: users table does not exist or is not accessible');
    console.error('   Error:', tableError.message);
    console.error('\n💡 Solution: Run the database migration: supabase/migrations/001_initial_schema.sql');
    return;
  }

  console.log('✅ users table exists\n');

  // Check each admin account
  for (const email of adminEmails) {
    console.log(`Checking: ${email}`);
    
    // Check in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === email);

    if (!authUser) {
      console.log(`  ❌ NOT FOUND in auth.users`);
      console.log(`  💡 Run: npm run create-admins`);
      continue;
    }

    console.log(`  ✅ Found in auth.users (ID: ${authUser.id})`);
    console.log(`     Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);

    // Check in users table
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (dbError || !dbUser) {
      console.log(`  ❌ NOT FOUND in users table`);
      console.log(`  💡 Run: supabase/migrations/003_add_admin_accounts.sql`);
      continue;
    }

    console.log(`  ✅ Found in users table`);
    console.log(`     Name: ${dbUser.name}`);
    console.log(`     Role: ${dbUser.role}`);
    
    // Check if role is correct
    const expectedRoles = {
      'platform.manager@csr-platform.com': 'platform-manager',
      'user.admin@csr-platform.com': 'user-admin',
      'csr.representative@csr-platform.com': 'csr-representative'
    };

    const expectedRole = expectedRoles[email];
    if (dbUser.role !== expectedRole) {
      console.log(`  ⚠️  WARNING: Role is "${dbUser.role}" but should be "${expectedRole}"`);
      console.log(`  💡 Fix: Run supabase/migrations/003_add_admin_accounts.sql`);
    } else {
      console.log(`  ✅ Role is correct`);
    }

    console.log('');
  }

  console.log('📋 Summary:');
  console.log('   If all accounts show ✅, you should be able to login.');
  console.log('   If any show ❌, follow the suggested fixes above.\n');
}

checkAdminAccounts().catch(console.error);

