/**
 * PROMOTE USER TO ADMIN
 * 
 * Usage: 
 * 1. Ensure you have the Supabase SERVICE_ROLE_KEY (found in Supabase Settings > API)
 * 2. Update the key below
 * 3. Run: node scripts/promote_admin.js <user_email>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// IMPORTANT: This requires the SERVICE_ROLE_KEY to bypass RLS and update roles
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY and EXPO_PUBLIC_SUPABASE_URL must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const emailToPromote = process.argv[2] || 'admin@freshflow.com';

async function promote() {
  console.log(`Promoting ${emailToPromote} to admin...`);

  // 1. Get User ID from Auth (Optional, but safer to find by email)
  // In a real script, we'd use supabase.auth.admin.listUsers() but for simplicity:
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('Error fetching users:', userError.message);
    return;
  }

  const user = users.users.find(u => u.email === emailToPromote);

  if (!user) {
    console.error(`User with email ${emailToPromote} not found.`);
    return;
  }

  console.log(`Found User ID: ${user.id}`);

  // 2. Update Profiles Table
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      role: 'admin',
      full_name: user.user_metadata?.full_name || 'Administrator',
      updated_at: new Date()
    });

  if (profileError) {
    console.error('Error updating profile:', profileError.message);
  } else {
    console.log('SUCCESS: User promoted to admin successfully!');
    console.log('The user can now log in and will be redirected to /admin.');
  }
}

promote();
