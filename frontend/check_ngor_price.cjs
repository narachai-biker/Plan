const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const content = fs.readFileSync("src/supabaseClient.js", "utf8");
const urlMatch = content.match(/supabaseUrl\s*=\s*['"`]?([^'"`]+)/);
const keyMatch = content.match(/supabaseKey\s*=\s*['"`]?([^'"`]+)/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
async function run() {
  const { data: orders, error } = await supabase
    .from('orderscart')
    .select('id, price')
    .eq('id', 1880);
  
  if (error) {
    console.error(error);
  } else {
    console.log(`Current price is: ${orders[0].price}`);
  }
}
run();
