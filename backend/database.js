const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                name TEXT,
                role TEXT,
                department TEXT,
                status TEXT
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS Activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                activity_id TEXT,
                budget_type TEXT,
                project TEXT,
                activity TEXT,
                department TEXT,
                responsible_person TEXT,
                lock_status TEXT,
                budget_cap REAL DEFAULT 0
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS ProductCatalog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT,
                item_name TEXT,
                unit TEXT,
                price REAL,
                budget_type TEXT,
                product_id TEXT,
                remark TEXT
            )`);

            // Orders_Cart equivalent
            db.run(`CREATE TABLE IF NOT EXISTS OrdersCart (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT UNIQUE,
                username TEXT,
                department TEXT,
                tab_category TEXT,
                term TEXT,
                activity_id TEXT,
                project TEXT,
                activity TEXT,
                item_name TEXT,
                budget_type TEXT,
                unit TEXT,
                price REAL,
                qty_requested INTEGER,
                qty_approved INTEGER DEFAULT 0,
                status TEXT DEFAULT 'รอพิจารณา',
                remark TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // History_Log equivalent
            db.run(`CREATE TABLE IF NOT EXISTS HistoryLog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT,
                department TEXT,
                admin_name TEXT,
                term TEXT,
                tab_category TEXT,
                activity_id TEXT,
                project TEXT,
                item_name TEXT,
                old_qty INTEGER,
                new_qty INTEGER,
                old_total REAL,
                new_total REAL,
                status TEXT,
                remark TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Department Lock Table
            db.run(`CREATE TABLE IF NOT EXISTS DepartmentLocks (
                department TEXT PRIMARY KEY,
                is_unlocked INTEGER DEFAULT 0
            )`);

            // System Settings Table
            db.run(`CREATE TABLE IF NOT EXISTS SystemSettings (
                key TEXT PRIMARY KEY,
                value TEXT
            )`);
            db.run(`INSERT OR IGNORE INTO SystemSettings (key, value) VALUES ('system_status', 'open')`);
        });
    }
});

module.exports = db;
