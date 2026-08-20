import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onchkyehalqhzcymnjlb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HEHJ3bl6HzbgqpsEHTaSrw_sKPLYsPL';

export const supabase = createClient(supabaseUrl, supabaseKey);
