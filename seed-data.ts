import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://onchkyehalqhzcymnjlb.supabase.co';
const supabaseAnonKey = 'sb_publishable_HEHJ3bl6HzbgqpsEHTaSrw_sKPLYsPL';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log("Seeding started...");

  // 1. Categories
  const { data: categories, error: catError } = await supabase.from('categories').insert([
    { name: 'Electronics', description: 'Electronic items and devices', code: 'ELEC', is_active: true },
    { name: 'Office Supplies', description: 'Stationery and office supplies', code: 'OFF', is_active: true },
    { name: 'Furniture', description: 'Office furniture', code: 'FURN', is_active: true }
  ]).select();
  
  if (catError) {
    console.error("Error seeding categories", catError);
    return;
  }
  console.log(`Created ${categories.length} categories.`);

  // 2. Units
  const { data: units, error: unitError } = await supabase.from('units').insert([
    { name: 'Pieces', symbol: 'pcs', is_active: true },
    { name: 'Boxes', symbol: 'box', is_active: true },
    { name: 'Kilograms', symbol: 'kg', is_active: true }
  ]).select();

  if (unitError) {
    console.error("Error seeding units", unitError);
    return;
  }
  console.log(`Created ${units.length} units.`);

  // 3. Items
  if (categories && categories.length > 0 && units && units.length > 0) {
    const { data: items, error: itemError } = await supabase.from('items').insert([
      {
        name: 'Dell OptiPlex 7090 Desktop',
        code: 'ITM-001',
        category_id: categories[0].id,
        unit_id: units[0].id,
        reorder_level: 5,
        price: 85000,
        is_active: true
      },
      {
        name: 'A4 Paper Rim (500 Sheets)',
        code: 'ITM-002',
        category_id: categories[1].id,
        unit_id: units[1].id,
        reorder_level: 20,
        price: 1500,
        is_active: true
      },
      {
        name: 'Ergonomic Office Chair',
        code: 'ITM-003',
        category_id: categories[2].id,
        unit_id: units[0].id,
        reorder_level: 2,
        price: 25000,
        is_active: true
      }
    ]).select();

    if (itemError) {
      console.error("Error seeding items", itemError);
      return;
    }
    console.log(`Created ${items.length} items.`);

    // 4. Stock
    if (items && items.length > 0) {
      const { data: stock, error: stockError } = await supabase.from('stock').insert([
        {
          item_id: items[0].id,
          quantity: 12,
          unit_price: 85000,
          batch_number: 'BATCH-001',
          location: 'Main Store - Rack A1'
        },
        {
          item_id: items[1].id,
          quantity: 45,
          unit_price: 1500,
          batch_number: 'BATCH-002',
          location: 'Main Store - Rack B4'
        },
        {
          item_id: items[2].id,
          quantity: 8,
          unit_price: 25000,
          batch_number: 'BATCH-003',
          location: 'Furniture Store - Ground Floor'
        }
      ]);
      
      if (stockError) {
        console.error("Error seeding stock", stockError);
      } else {
        console.log(`Created stock entries.`);
      }
    }
  }

  console.log("Seeding completed successfully!");
}

seed();
