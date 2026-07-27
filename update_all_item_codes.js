const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://onchkyehalqhzcymnjlb.supabase.co';
const supabaseKey = 'sb_publishable_HEHJ3bl6HzbgqpsEHTaSrw_sKPLYsPL';
const supabase = createClient(supabaseUrl, supabaseKey);

async function formatAllItemCodes() {
  console.log('Fetching items from Supabase...');
  const { data: items, error } = await supabase.from('items').select('id, code, created_at').order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching items:', error);
    return;
  }

  console.log(`Found ${items.length} items. Formatting codes to ITM-00000 format...`);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const newCode = `ITM-${String(i + 1).padStart(5, '0')}`;
    if (item.code !== newCode) {
      console.log(`Updating Item ID ${item.id}: '${item.code}' -> '${newCode}'`);
      const { error: updateError } = await supabase
        .from('items')
        .update({ code: newCode })
        .eq('id', item.id);
        
      if (updateError) {
        console.error(`Failed to update item ${item.id}:`, updateError);
      }
    } else {
      console.log(`Item ID ${item.id} already has code '${newCode}'`);
    }
  }

  console.log('Finished updating all item codes successfully!');
}

formatAllItemCodes();
