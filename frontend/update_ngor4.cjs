const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const content = fs.readFileSync("src/supabaseClient.js", "utf8");
const urlMatch = content.match(/supabaseUrl\s*=\s*['"`]?([^'"`]+)/);
const keyMatch = content.match(/supabaseKey\s*=\s*['"`]?([^'"`]+)/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
async function run() {
  const { error } = await supabase
    .from('orderscart')
    .update({ price: 902659 })
    .eq('id', 1880);
  
  if (error) {
    console.error(error);
  } else {
    console.log("Updated successfully to 902,659 THB");
  }
}
run();
