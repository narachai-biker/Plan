const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const content = fs.readFileSync("src/supabaseClient.js", "utf8");
const urlMatch = content.match(/supabaseUrl\s*=\s*['"`]?([^'"`]+)/);
const keyMatch = content.match(/supabaseKey\s*=\s*['"`]?([^'"`]+)/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
async function run() {
  const [uRes, lRes, aRes] = await Promise.all([
    supabase.from("users").select("*").eq("username", "Administration"),
    supabase.from("departmentlocks").select("*").eq("department", "สำนักงานผู้อำนวยการ"),
    supabase.from("activities").select("*").eq("activity_id", "งก01")
  ]);
  console.log("User:", uRes.data);
  console.log("Lock:", lRes.data);
  console.log("Activity:", aRes.data);
}
run();
