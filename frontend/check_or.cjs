const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const content = fs.readFileSync("src/supabaseClient.js", "utf8");
const urlMatch = content.match(/supabaseUrl\s*=\s*['"`]?([^'"`]+)/);
const keyMatch = content.match(/supabaseKey\s*=\s*['"`]?([^'"`]+)/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
async function run() {
  const { data: orders, error } = await supabase
    .from('orderscart')
    .select('*')
    .eq('activity_id', 'อ01')
    .eq('term', '2/2569');
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${orders.length} orders for อ01 in 2/2569.`);
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Item: ${o.item_name}, Qty: ${o.qty_requested}, Price: ${o.price}`);
  });
}
run();
