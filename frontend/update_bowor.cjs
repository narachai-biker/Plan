const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const content = fs.readFileSync("src/supabaseClient.js", "utf8");
const urlMatch = content.match(/supabaseUrl\s*=\s*['"`]?([^'"`]+)/);
const keyMatch = content.match(/supabaseKey\s*=\s*['"`]?([^'"`]+)/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
async function run() {
  console.log("Updating activities table...");
  const { error: err1 } = await supabase
    .from('activities')
    .update({ department: 'กลุ่มบริหารวิชาการ' })
    .like('activity_id', 'บว%');
  
  if (err1) {
    console.error("Error updating activities:", err1);
    return;
  }
  console.log("Activities updated.");

  console.log("Updating orderscart table...");
  const { error: err2 } = await supabase
    .from('orderscart')
    .update({ department: 'กลุ่มบริหารวิชาการ' })
    .like('activity_id', 'บว%');

  if (err2) {
    console.error("Error updating orderscart:", err2);
    return;
  }
  console.log("Orderscart updated.");
  console.log("Done!");
}
run();
