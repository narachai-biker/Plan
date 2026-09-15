const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const content = fs.readFileSync("src/supabaseClient.js", "utf8");
const urlMatch = content.match(/supabaseUrl\s*=\s*['"`]?([^'"`]+)/);
const keyMatch = content.match(/supabaseKey\s*=\s*['"`]?([^'"`]+)/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
async function run() {
  const usersToInsert = [1, 2, 3, 4, 5].map(i => ({
    username: `admin${i}`,
    password: `admin1234`,
    name: `ฝ่ายบริหาร ${i}`,
    role: `board`,
    department: ``,
    status: `active`
  }));
  const { error } = await supabase.from("users").insert(usersToInsert);
  console.log(error ? error : "Board users inserted.");
}
run();
