
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
// Just load from .env.local in current dir
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
// console.log('Key:', supabaseKey); // Don't log key

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('Checking users...');
  const { data, error } = await supabase.from('app_users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users:', JSON.stringify(data, null, 2));
  }
}

async function tryDeduct(username: string) {
    console.log(`Trying to deduct from ${username}...`);
    // 1. Get user
    const { data: user, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (fetchError || !user) {
        console.error('User not found');
        return;
    }

    console.log(`Current credits for ${username}:`, user.credits);

    // 2. Update
    const newCredits = user.credits - 1;
    const { data: updated, error: updateError } = await supabase
      .from('app_users')
      .update({ credits: newCredits })
      .eq('id', user.id)
      .select();

    if (updateError) {
        console.error('Update failed:', updateError);
    } else {
        console.log('Update success:', updated);
    }
}

// Run
await checkUsers();
await tryDeduct('test'); 
