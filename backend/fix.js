const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  const correctName = 'บริหารงบประมาณและแผนงาน(งานพัสดุ)';
  const wrongName1 = 'บริหารงบประมาณและแผนงาน(งานพััสดุ)'; // extra hidden vowel
  const wrongName2 = 'บริหารงบประมาณและแผนงาน(งานพัสดุุ)'; // extra hidden vowel

  console.log('Fixing typos in Activities...');
  db.run(`UPDATE Activities SET department = ? WHERE department IN (?, ?)`, [correctName, wrongName1, wrongName2]);

  console.log('Fixing typos in OrdersCart...');
  db.run(`UPDATE OrdersCart SET department = ? WHERE department IN (?, ?)`, [correctName, wrongName1, wrongName2]);

  console.log('Fixing typos in Users...');
  db.run(`UPDATE Users SET department = ? WHERE department IN (?, ?)`, [correctName, wrongName1, wrongName2], () => {
    console.log('Done!');
  });
});
