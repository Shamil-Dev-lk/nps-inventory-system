import { createClient } from '@supabase/supabase-js'; 
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data: orgData } = await supabase.from('organizations').select('id').limit(1).single();
  if (orgData) {
    const { data, error } = await supabase.from('organizations').update({
      primary_color: '#e11d48', // Ruby Red / Rose 600
      secondary_color: '#1f2937', // Dark Gray
      accent_color: '#f43f5e'
    }).eq('id', orgData.id).select();
    console.log("UPDATE COLOR", data, error);
  }
}
test();
