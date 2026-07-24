const { createClient } = require('@supabase/supabase-js');

// We need to use the exact URL and anon key from the user's .env.local
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase
        .from('purchase_requests')
        .select('*, items:purchase_request_items(*, item:items(*))')
        .limit(1);
    
    if (error) {
        console.error("SUPABASE ERROR:", error);
    } else {
        console.log("SUCCESS. Data:", JSON.stringify(data, null, 2));
    }
}

test();
