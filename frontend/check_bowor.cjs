const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const content = fs.readFileSync("src/supabaseClient.js", "utf8");
const urlMatch = content.match(/supabaseUrl\s*=\s*['"`]?([^'"`]+)/);
const keyMatch = content.match(/supabaseKey\s*=\s*['"`]?([^'"`]+)/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
async function run() {
  const { data: acts, error: err1 } = await supabase.from('activities').select('*').like('activity_id', 'บว%');
  const { data: orders, error: err2 } = await supabase.from('orderscart').select('*').like('activity_id', 'บว%');
  
  console.log(`Found ${acts?.length} activities starting with บว.`);
  acts.forEach(a => console.log(`${a.activity_id}: ${a.department}`));
  console.log(`Found ${orders?.length} orderscart items tied to บว activities.`);
}
run();
