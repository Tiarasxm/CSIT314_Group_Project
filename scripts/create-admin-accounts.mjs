/**
 * Script to create pre-set admin accounts in Supabase
 * 
 * Usage:
 * 1. Get your Supabase Service Role Key from Dashboard → Settings → API
 * 2. Add it to .env.local as SUPABASE_SERVICE_ROLE_KEY
 * 3. Run: node scripts/create-admin-accounts.mjs
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
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Get your Service Role Key from: Supabase Dashboard → Settings → API');
  console.error('   Add it to .env.local as: SUPABASE_SERVICE_ROLE_KEY=your-key-here');
  process.exit(1);
}

// Create Supabase admin client (uses service role key for admin operations)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminAccounts = [
  {
    email: 'platform.manager@csr-platform.com',
    password: 'PlatformManager2024!',
    name: 'Platform Manager',
    firstName: 'Platform',
    lastName: 'Manager',
    role: 'platform-manager'
  },
  {
    email: 'user.admin@csr-platform.com',
    password: 'UserAdmin2024!',
    name: 'User Administrator',
    firstName: 'User',
    lastName: 'Administrator',
    role: 'user-admin'
  },
  {
    email: 'csr.representative@csr-platform.com',
    password: 'CSRRep2024!',
    name: 'CSR Representative',
    firstName: 'CSR',
    lastName: 'Representative',
    role: 'csr-representative'
  }
];

async function createAdminAccounts() {
  console.log('🚀 Creating admin accounts...\n');

  for (const account of adminAccounts) {
    try {
      console.log(`Creating account: ${account.email}`);

      // Check if user already exists
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error(`  ❌ Error listing users:`, listError.message);
        continue;
      }

      const existingUser = existingUsers?.users?.find(u => u.email === account.email);
      let userId;

      if (existingUser) {
        console.log(`  ⚠️  User already exists, updating...`);
        userId = existingUser.id;

        // Update password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: account.password }
        );

        if (updateError) {
          console.error(`  ❌ Error updating password:`, updateError.message);
        } else {
          console.log(`  ✅ Password updated`);
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: account.name,
            first_name: account.firstName,
            last_name: account.lastName,
            role: account.role
          }
        });

        if (createError) {
          console.error(`  ❌ Error creating user:`, createError.message);
          continue;
        }

        userId = newUser.user.id;
        console.log(`  ✅ User created in Auth`);
      }

      // Wait a bit for the trigger to create the user in the users table
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user exists in users table
      const { data: userInTable, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        console.error(`  ❌ Error checking users table:`, fetchError.message);
        continue;
      }

      if (userInTable) {
        // Update existing user
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            email: account.email,
            name: account.name,
            first_name: account.firstName,
            last_name: account.lastName,
            role: account.role
          })
          .eq('id', userId);

        if (updateError) {
          console.error(`  ❌ Error updating users table:`, updateError.message);
        } else {
          console.log(`  ✅ User updated in users table`);
        }
      } else {
        // Insert new user
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email: account.email,
            name: account.name,
            first_name: account.firstName,
            last_name: account.lastName,
            role: account.role
          });

        if (insertError) {
          console.error(`  ❌ Error inserting into users table:`, insertError.message);
        } else {
          console.log(`  ✅ User created in users table`);
        }
      }

      console.log(`  ✅ Account ready: ${account.email} / ${account.password}\n`);

    } catch (error) {
      console.error(`  ❌ Unexpected error:`, error.message);
      console.log('');
    }
  }

  console.log('✨ Done! All admin accounts are ready to use.');
  console.log('\n📋 Account Summary:');
  adminAccounts.forEach(account => {
    console.log(`   ${account.email} (${account.role})`);
  });
  console.log('\n🔑 You can now login at: http://localhost:3000/staff/login');
}

// Run the script
createAdminAccounts().catch(console.error);

