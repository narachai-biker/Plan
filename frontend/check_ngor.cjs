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
    .eq('activity_id', 'งก01')
    .eq('department', 'สำนักงานผู้อำนวยการ');
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${orders.length} orders for งก01.`);
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Item: ${o.item_name}, QtyReq: ${o.qty_requested}, QtyApp: ${o.qty_approved}, Price: ${o.price}, Status: ${o.status}, TotalReq: ${o.qty_requested * o.price}, TotalApp: ${o.qty_approved * o.price}`);
  });
}
run();
