const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = 'https://bpfepokjuvomdpjwklwe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZmVwb2tqdXZvbWRwandrbHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzkyMDYsImV4cCI6MjA5NzIxNTIwNn0.jjsPIFNWY6rcBU1RVRPxBr3pSOmgaaTdU7RwYaHyrWQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function migrateTable(tableName, orderBy = 'id') {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`, async (err, rows) => {
            if (err) return reject(err);
            if (rows.length === 0) {
                console.log(`Skipping ${tableName}: No data.`);
                return resolve();
            }

            console.log(`Migrating ${rows.length} rows from ${tableName}...`);
            
            // Because Supabase API limits rows per request, chunk it
            const chunkSize = 100;
            for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize);
                const { error } = await supabase.from(tableName.toLowerCase()).insert(chunk);
                if (error) {
                    // Fallback to exactly casing if lowercasing table name fails, wait Supabase uses exact casing for inserts if created with exact casing.
                    const { error: err2 } = await supabase.from(tableName).insert(chunk);
                    if (err2) {
                        console.error(`Error inserting into ${tableName}:`, err2);
                    }
                }
            }
            console.log(`Finished ${tableName}.`);
            resolve();
        });
    });
}

async function runMigration() {
    console.log('Starting data migration to Supabase...');
    try {
        await migrateTable('Users');
        await migrateTable('Activities');
        await migrateTable('ProductCatalog');
        await migrateTable('OrdersCart');
        await migrateTable('HistoryLog');
        await migrateTable('DepartmentLocks', 'department');
        await migrateTable('SystemSettings', 'key');
        console.log('✅ Migration complete!');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

runMigration();
