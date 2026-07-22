import { createClient } from '@supabase/supabase-js'; 
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data: orgData } = await supabase.from('organizations').select('id').limit(1).single();
  if (orgData) {
    const { data, error } = await supabase.from('organizations').update({
      footer_text: null
    }).eq('id', orgData.id).select();
    console.log("UPDATE FOOTER", data, error);
  }
}
test();
