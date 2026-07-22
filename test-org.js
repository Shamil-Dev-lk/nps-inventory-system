import { createClient } from '@supabase/supabase-js'; 
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data: orgData, error: orgErr } = await supabase.from('organizations').select('id').limit(1).single();
  let id = orgData?.id;

  const updateData = {
    name_en: "Nikaweratiya Pradeshiya Sabha",
    name_si: "නිකවැරටිය ප්රාදේශිය සභාව",
    name_ta: "நிகவெரட்டிய பிரதேச சபை",
    short_name: "Nikaweratiya PS",
    system_name: "Pradheshiya Sabha",
    telephone: "+94372260275",
    email: "nikaweratiyasabha@gmail.com",
    website: "",
    district: "Kurunegala",
    province: "North Western",
    chairman_name: "Nilantha Bandara",
    secretary_name: "Asanka Kumara",
    address: "Maho Road, Nikaweratiya"
  };

  if (id) {
    const { data, error } = await supabase.from('organizations').update(updateData).eq('id', id).select();
    console.log("UPDATE", data, error);
  }
}
test();
