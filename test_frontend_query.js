const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.split('\n').find(l=>l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l=>l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY')).split('=')[1].trim();
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('users').select('*, department:departments(id, name_en)');
  console.log("Error:", error);
  console.log("Data count:", data ? data.length : 0);
  console.log("Data sample:", data ? data[0] : null);
}
run();
