const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.split('\n').find(l=>l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l=>l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY')).split('=')[1].trim();
const supabase = createClient(url, key);

// Fetch all tables by doing a raw query to pg_catalog or using swagger? No, just try to fetch a few common ones
async function run() {
  const tables = ['users', 'profiles', 'employees', 'auth_users', 'customers', 'suppliers'];
  for (const t of tables) {
    const {data, error} = await supabase.from(t).select('id').limit(1);
    console.log(`Table ${t}:`, error ? error.message : (data.length + ' rows'));
  }
}
run();
