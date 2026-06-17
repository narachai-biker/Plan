const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
    console.log('Clearing databases...');
    db.run('DELETE FROM OrdersCart');
    db.run('DELETE FROM HistoryLog');
    db.run('DELETE FROM Users');
    
    console.log('Inserting default admin...');
    db.run(
        `INSERT INTO Users (username, password, name, role, department, status) VALUES (?, ?, ?, ?, ?, ?)`,
        ['plan', 'admin1234', 'งานแผนงาน', 'admin', 'บริหารงบประมาณและแผนงาน(งานแผนงาน)', 'active']
    );

    console.log('Done!');
});
