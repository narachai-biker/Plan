const ExcelJS = require('exceljs');
const path = require('path');
const db = require('./database');

async function seed() {
    const filePath = path.resolve(__dirname, '../ระบบจัดสรรงบประมาณ.xlsx');
    const workbook = new ExcelJS.Workbook();
    
    console.log('Reading Excel file...');
    await workbook.xlsx.readFile(filePath);

    // Seed Users
    const usersSheet = workbook.getWorksheet('Users');
    if (usersSheet) {
        db.run('DELETE FROM Users');
        usersSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const values = row.values;
            // ExcelJS arrays are 1-indexed. [empty, col1, col2, ...]
            db.run(
                'INSERT INTO Users (username, password, name, role, department, status) VALUES (?, ?, ?, ?, ?, ?)',
                [values[1], values[2], values[3], values[4], values[5], values[6]],
                (err) => { if (err) console.error(err.message); }
            );
        });
        console.log('Seeded Users');
    }

    // Seed Activities
    const activitiesSheet = workbook.getWorksheet('Activities');
    if (activitiesSheet) {
        db.run('DELETE FROM Activities');
        activitiesSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const values = row.values;
            db.run(
                'INSERT INTO Activities (activity_id, budget_type, project, activity, department, responsible_person, lock_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [values[1], values[2], values[3], values[4], values[5], values[6], values[7]],
                (err) => { if (err) console.error(err.message); }
            );
        });
        console.log('Seeded Activities');
    }

    // Seed ProductCatalog
    const productCatalogSheet = workbook.getWorksheet('Product_Catalog');
    if (productCatalogSheet) {
        db.run('DELETE FROM ProductCatalog');
        productCatalogSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const values = row.values;
            db.run(
                'INSERT INTO ProductCatalog (category, item_name, unit, price, budget_type, product_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [values[1], values[2], values[3], values[4], values[5], values[6], values[7]],
                (err) => { if (err) console.error(err.message); }
            );
        });
        console.log('Seeded ProductCatalog');
    }

    // Orders_Cart and History_Log could also be seeded, but starting empty is usually better for a fresh app unless they want existing records.
    // Let's seed existing Orders_Cart for testing if they exist.
    const ordersSheet = workbook.getWorksheet('Orders_Cart');
    if (ordersSheet) {
        db.run('DELETE FROM OrdersCart');
        ordersSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const values = row.values;
            if (!values[2]) return; // Skip empty rows
            
            // Map values to fields
            db.run(
                `INSERT INTO OrdersCart (
                    order_id, username, department, tab_category, term, activity_id, 
                    project, activity, item_name, budget_type, unit, price, 
                    qty_requested, qty_approved, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    values[2], values[3], values[4], values[5], values[6], values[7],
                    values[8], values[9], values[10], values[11], values[12], values[13],
                    values[14], values[16], values[18] // qty_app is col 16? 
                    // Let's rely on standard UI entry for testing or seed minimally.
                ],
                (err) => { if (err) console.error(err.message); }
            );
        });
        console.log('Seeded OrdersCart');
    }

    console.log('Seeding finished (async queries may still be writing). Wait a moment and Ctrl+C.');
}

seed().catch(console.error);
