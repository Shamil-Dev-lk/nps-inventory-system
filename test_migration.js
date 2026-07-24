const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.split('\n').find(l=>l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l=>l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY')).split('=')[1].trim();
const supabase = createClient(url, key);

async function run() {
  const dummyUser = {
    name: 'Test Migration User',
    email: `test_${Math.random()}@example.com`,
    employee_id: 'EMP123',
    designation: 'Staff',
    phone: '123456',
    is_active: true,
    created_at: new Date().toISOString(),
    role: 'staff'
  };

  const { data, error } = await supabase.from('users').insert([dummyUser]).select();
  console.log("Migration Insert Result:", error ? error : data);
}
run();
