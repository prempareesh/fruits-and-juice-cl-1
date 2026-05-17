
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './customer-app/.env' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('Checking Supabase Schema...');
  
  const tables = ['profiles', 'orders', 'order_items', 'products', 'settings'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table "${table}": ${error.message} (${error.code})`);
    } else {
      console.log(`✅ Table "${table}": Exists`);
    }
  }

  // Check RPC
  const { data, error } = await supabase.rpc('place_order_v2', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_address: 'test',
    p_total_amount: 0,
    p_payment_type: 'test',
    p_items: []
  });
  
  if (error) {
    console.log(`❌ RPC "place_order_v2": ${error.message} (${error.code})`);
  } else {
    console.log(`✅ RPC "place_order_v2": Exists and returned:`, data);
  }
}

checkSchema();
