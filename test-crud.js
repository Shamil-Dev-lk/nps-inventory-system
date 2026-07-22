import { createClient } from '@supabase/supabase-js'; 
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  console.log("Adding item...");
  const { data: addData, error: addError } = await supabase.from('items').insert([{ name_en: 'Test Item 123', code: 'TEST-123' }]).select().single();
  console.log("Add:", addData, addError);
  
  if (addData) {
    console.log("Updating item...");
    const { data: updateData, error: updateError } = await supabase.from('items').update({ name_en: 'Test Item Updated' }).eq('id', addData.id).select().single();
    console.log("Update:", updateData, updateError);
    
    console.log("Deleting item...");
    const { data: delData, error: delError } = await supabase.from('items').delete().eq('id', addData.id).select();
    console.log("Delete:", delData, delError);
  }
}
test();
