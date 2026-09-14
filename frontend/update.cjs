const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const content = fs.readFileSync("src/supabaseClient.js", "utf8");
const urlMatch = content.match(/supabaseUrl\s*=\s*['"`]?([^'"`]+)/);
const keyMatch = content.match(/supabaseKey\s*=\s*['"`]?([^'"`]+)/);
const supabase = createClient(urlMatch[1], keyMatch[1]);

const updates = [
  { old: '6.ค่าจ้างครูต่างชาติ', new: '7.ค่าจ้างครูต่างชาติ' },
  { old: '6.ค่าจ้างบุคลากรที่ปฏิบัติงาน', new: '8.ค่าจ้างบุคลากรที่ปฏิบัติงาน' },
  { old: '6.ค่าคู่มือนักเรียน', new: '9.ค่าคู่มือนักเรียน' },
  { old: '6.ค่าวารสารโรงเรียน', new: '10.ค่าวารสารโรงเรียน' },
  { old: '6.ค่าบัตรประจำตัวนักเรียน', new: '11.ค่าบัตรประจำตัวนักเรียน' },
  { old: '6.ค่ากิจกรรมปฐมนิเทศ', new: '12.ค่ากิจกรรมปฐมนิเทศ' },
  { old: '6.ค่าประกันชีวิต', new: '13.ค่าประกันชีวิต' },
  { old: '6.ค่ากองทุนเพื่อการกู้ยืม', new: '14.ค่ากองทุนเพื่อการกู้ยืม' }
];

async function run() {
  for (const { old: o, new: n } of updates) {
    const { data, error } = await supabase.from('activities').update({ budget_type: n }).eq('budget_type', o);
    if (error) console.error("Error updating", o, error);
    else console.log("Updated", o, "to", n);
  }
}
run();
