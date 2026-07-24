const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.split('\n').find(l=>l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l=>l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY')).split('=')[1].trim();
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    console.error('RPC failed, trying generic query', error.message);
    const { data: qData, error: qErr } = await supabase.from('information_schema.tables').select('*').eq('table_schema', 'public');
    console.log(qErr || qData);
  } else {
    console.log(data);
  }
}
run();
