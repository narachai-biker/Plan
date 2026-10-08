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
    .eq('activity_id', 'บง04')
    .eq('term', '1/2570');
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${orders.length} orders for บง04 in 1/2570.`);
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Item: ${o.item_name}`);
  });
}
run();
