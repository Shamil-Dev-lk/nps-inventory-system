const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function updatePermissions() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.split('\n').find(l=>l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].trim();
  const key = env.split('\n').find(l=>l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY')).split('=')[1].trim();
  const supabase = createClient(url, key);

  const storeKeeperPermissions = [
    'view-items',
    'create-items',
    'edit-items',
    'view-assets',
    'view-grn',
    'create-grn',
    'view-stock-issues',
    'create-stock-issues',
    'view-stock-returns',
    'create-stock-returns',
    'view-stock-transfers',
    'create-stock-transfers',
    'view-stock-adjustments',
    'create-stock-adjustments',
    'view-stock-taking',
    'create-stock-taking',
    'view-purchase-requests',
    'create-purchase-requests'
  ];

  console.log('Updating Store Trainee permissions...');
  
  // Update by name
  const { data, error } = await supabase
    .from('roles')
    .update({ permissions: storeKeeperPermissions })
    .ilike('name', '%Store%')
    .select();

  if (error) {
    console.error('Error updating roles:', error);
  } else {
    console.log('Successfully updated roles:', data);
  }
}

updatePermissions();
