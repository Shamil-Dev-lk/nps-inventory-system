import { createClient } from '@supabase/supabase-js'; 
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  console.log("Testing Insert...");
  let { data, error } = await supabase.from('categories').insert([{ name_en: 'TestCat', code: 'TCAT' }]).select();
  console.log("Insert Error:", error);
  if (data) {
    console.log("Inserted Data:", data);
    const id = data[0].id;
    console.log("Testing Update...");
    let updateRes = await supabase.from('categories').update({ name_en: 'TestCat Updated' }).eq('id', id).select();
    console.log("Update Error:", updateRes.error);
    console.log("Updated Data:", updateRes.data);
    
    console.log("Testing Delete...");
    let deleteRes = await supabase.from('categories').delete().eq('id', id).select();
    console.log("Delete Error:", deleteRes.error);
    console.log("Deleted Data:", deleteRes.data);
  }
}
test();
