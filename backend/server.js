const express = require('express');
const cors = require('cors');
const db = require('./database');
const ExcelJS = require('exceljs');

const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const PORT = 3001;

// Auth endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM Users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ user: row });
    });
});

// Fetch activities for dropdowns
app.get('/api/activities', (req, res) => {
    db.all('SELECT * FROM Activities', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Fetch product catalog
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM ProductCatalog', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// Admin Add Product
app.post('/api/admin/products', (req, res) => {
    const { category, item_name, unit, price, budget_type, product_id, remark } = req.body;
    db.run(`INSERT INTO ProductCatalog (category, item_name, unit, price, budget_type, product_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        [category, item_name, unit, price, budget_type, product_id, remark], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

// Admin Update Product
app.put('/api/admin/products/:id', (req, res) => {
    const { category, item_name, unit, price, budget_type, product_id, remark } = req.body;
    db.run(`UPDATE ProductCatalog SET category=?, item_name=?, unit=?, price=?, budget_type=?, product_id=?, remark=? WHERE id=?`, 
        [category, item_name, unit, price, budget_type, product_id, remark, req.params.id], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Admin Delete Product
app.delete('/api/admin/products/:id', (req, res) => {
    db.run(`DELETE FROM ProductCatalog WHERE id=?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Admin Bulk Add Products
app.post('/api/admin/products/bulk', (req, res) => {
    const { products } = req.body;
    if (!products || !products.length) return res.json({ success: true });
    
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare(`INSERT INTO ProductCatalog (category, item_name, unit, price, budget_type, product_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        products.forEach(p => {
            stmt.run(p.category, p.item_name, p.unit, p.price, p.budget_type || '', p.product_id || '', p.remark || '');
        });
        stmt.finalize();
        db.run("COMMIT", (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, count: products.length });
        });
    });
});


// Submit a cart request
app.post('/api/requests', (req, res) => {
    const { requests } = req.body; // Array of items
    // generate an order ID
    const orderId = 'ORD-' + Date.now();

    const placeholders = requests.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const values = [];
    requests.forEach(r => {
        values.push(
            orderId, r.username, r.department, r.tab_category, r.term, r.activity_id,
            r.project, r.activity, r.item_name, r.budget_type, r.unit, r.price,
            r.qty_requested, 0, 'รอพิจารณา', r.remark || ''
        );
    });

    const sql = `INSERT INTO OrdersCart (order_id, username, department, tab_category, term, activity_id, project, activity, item_name, budget_type, unit, price, qty_requested, qty_approved, status, remark) VALUES ${placeholders}`;
    db.run(sql, values, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        requests.forEach(r => {
            db.run(`INSERT INTO HistoryLog (order_id, department, admin_name, term, tab_category, activity_id, project, item_name, old_qty, new_qty, old_total, new_total, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [orderId, r.department, r.username, r.term, r.tab_category, r.activity_id, r.project, r.item_name, 0, r.qty_requested, 0, r.qty_requested * r.price, 'ผู้ใช้เพิ่มรายการ']
            );
        });

        res.json({ success: true, orderId });
    });
});

// Fetch all requests (admin) or by user (user)
app.get('/api/requests', (req, res) => {
    const { department, role } = req.query;
    let sql = 'SELECT * FROM OrdersCart';
    let params = [];
    if (department && department !== 'ALL') {
        sql += ' WHERE department = ?';
        params.push(department);
    }
    sql += ' ORDER BY term DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update request (Admin approval or User Edit)
app.put('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    const { qty_approved, status, admin_name, user_edit, qty_requested, remark } = req.body;

    db.get('SELECT * FROM OrdersCart WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Not found' });

        if (user_edit) {
            const old_qty = row.qty_requested;
            db.run('UPDATE OrdersCart SET qty_requested = ?, remark = ? WHERE id = ?', [qty_requested, remark, id], function(err2) {
                if (err2) return res.status(500).json({ error: err2.message });
                db.run(`INSERT INTO HistoryLog (order_id, department, admin_name, term, tab_category, activity_id, project, item_name, old_qty, new_qty, old_total, new_total, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                    [row.order_id, row.department, admin_name || row.username, row.term, row.tab_category, row.activity_id, row.project, row.item_name, old_qty, qty_requested, old_qty * row.price, qty_requested * row.price, 'ผู้ใช้แก้ไขรายการ'],
                    () => { res.json({ success: true }); }
                );
            });
        } else {
            const old_qty = row.qty_requested;
            const old_total = old_qty * row.price;
            const new_total = qty_approved * row.price;

            db.run('UPDATE OrdersCart SET qty_approved = ?, status = ? WHERE id = ?', [qty_approved, status, id], function(err2) {
                if (err2) return res.status(500).json({ error: err2.message });

                db.run(`INSERT INTO HistoryLog (order_id, department, admin_name, term, tab_category, activity_id, project, item_name, old_qty, new_qty, old_total, new_total, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                    [row.order_id, row.department, admin_name, row.term, row.tab_category, row.activity_id, row.project, row.item_name, old_qty, qty_approved, old_total, new_total, status],
                    (err3) => {
                        res.json({ success: true });
                    }
                );
            });
        }
    });
});

// Delete request (User only)
app.delete('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    const { username } = req.query;
    db.get('SELECT * FROM OrdersCart WHERE id = ?', [id], (err, row) => {
        if (!row) return res.json({ success: true });
        db.run('DELETE FROM OrdersCart WHERE id = ?', [id], function(err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            db.run(`INSERT INTO HistoryLog (order_id, department, admin_name, term, tab_category, activity_id, project, item_name, old_qty, new_qty, old_total, new_total, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [row.order_id, row.department, username || row.username, row.term, row.tab_category, row.activity_id, row.project, row.item_name, row.qty_requested, 0, row.qty_requested * row.price, 0, 'ผู้ใช้ลบรายการ'],
                () => { res.json({ success: true }); }
            );
        });
    });
});

// Admin configure department lock
app.put('/api/admin/departments/lock', (req, res) => {
    const { department, is_unlocked } = req.body;
    db.run('INSERT INTO DepartmentLocks (department, is_unlocked) VALUES (?, ?) ON CONFLICT(department) DO UPDATE SET is_unlocked = excluded.is_unlocked', 
        [department, is_unlocked], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Fetch department locks
app.get('/api/departments/locks', (req, res) => {
    db.all('SELECT * FROM DepartmentLocks', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin configure system status
app.put('/api/admin/settings/system_status', (req, res) => {
    const { status } = req.body;
    const isUnlocked = status === 'open' ? 1 : 0;
    
    db.serialize(() => {
        db.run('INSERT INTO SystemSettings (key, value) VALUES ("system_status", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [status]);
        
        db.run(`
            INSERT INTO DepartmentLocks (department, is_unlocked)
            SELECT DISTINCT department, ? FROM Activities
            ON CONFLICT(department) DO UPDATE SET is_unlocked = excluded.is_unlocked
        `, [isUnlocked], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// Fetch system status
app.get('/api/settings/system_status', (req, res) => {
    db.get('SELECT value FROM SystemSettings WHERE key = "system_status"', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: row ? row.value : 'open' });
    });
});

// --- User Management API ---

// Get all users
app.get('/api/admin/users', (req, res) => {
    db.all('SELECT * FROM Users', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create user
app.post('/api/admin/users', (req, res) => {
    const { username, password, name, role, department, status } = req.body;
    db.run(
        'INSERT INTO Users (username, password, name, role, department, status) VALUES (?, ?, ?, ?, ?, ?)',
        [username, password, name, role, department, status || 'active'],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Update user
app.put('/api/admin/users/:id', (req, res) => {
    const { username, password, name, role, department, status } = req.body;
    db.run(
        'UPDATE Users SET username = ?, password = ?, name = ?, role = ?, department = ?, status = ? WHERE id = ?',
        [username, password, name, role, department, status || 'active', req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Delete user
app.delete('/api/admin/users/:id', (req, res) => {
    db.run('DELETE FROM Users WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Dashboard stats (Admin)
app.get('/api/admin/dashboard', (req, res) => {
    const { budgetCategory } = req.query; // 1 (อุดหนุน), 2 (พัฒนาผู้เรียน), 3 (รายได้สถานศึกษา)

    let sql = '';
    let params = [];

    if (budgetCategory === '1') {
        // เงินอุดหนุน (ค่าจัดการเรียนการสอน)
        sql = `
            SELECT 
                O.department,
                SUM(CASE WHEN O.tab_category = 'Activities' THEN (CASE WHEN O.status = 'รอพิจารณา' THEN O.qty_requested WHEN O.status = 'ไม่อนุมัติ' THEN 0 ELSE O.qty_approved END) * O.price ELSE 0 END) as activity_total,
                SUM(CASE WHEN O.tab_category = 'Office Supplies' THEN (CASE WHEN O.status = 'รอพิจารณา' THEN O.qty_requested WHEN O.status = 'ไม่อนุมัติ' THEN 0 ELSE O.qty_approved END) * O.price ELSE 0 END) as office_total,
                SUM(CASE WHEN O.tab_category = 'Technology' THEN (CASE WHEN O.status = 'รอพิจารณา' THEN O.qty_requested WHEN O.status = 'ไม่อนุมัติ' THEN 0 ELSE O.qty_approved END) * O.price ELSE 0 END) as tech_total
            FROM OrdersCart O
            LEFT JOIN Activities A ON O.activity_id = A.activity_id
            WHERE A.budget_type LIKE '%ค่าจัดการเรียนการสอน%' OR O.tab_category IN ('Office Supplies', 'Technology')
            GROUP BY O.department
        `;
    } else if (budgetCategory === '2') {
        // เงินกิจกรรมพัฒนาคุณภาพผู้เรียน
        sql = `
            SELECT 
                A.activity as activity_name,
                SUM((CASE WHEN O.status = 'รอพิจารณา' THEN O.qty_requested WHEN O.status = 'ไม่อนุมัติ' THEN 0 ELSE O.qty_approved END) * O.price) as total
            FROM OrdersCart O
            LEFT JOIN Activities A ON O.activity_id = A.activity_id
            WHERE A.budget_type LIKE '%กิจกรรมพัฒนาคุณภาพผู้เรียน%'
            GROUP BY A.activity
        `;
    } else if (budgetCategory === '3') {
        // เงินรายได้สถานศึกษา
        sql = `
            SELECT 
                A.activity as activity_name,
                SUM((CASE WHEN O.status = 'รอพิจารณา' THEN O.qty_requested WHEN O.status = 'ไม่อนุมัติ' THEN 0 ELSE O.qty_approved END) * O.price) as total
            FROM OrdersCart O
            LEFT JOIN Activities A ON O.activity_id = A.activity_id
            WHERE O.activity_id LIKE 'รด%' OR A.activity_id LIKE 'รด%'
            GROUP BY A.activity
        `;
    } else {
        return res.json([]);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin History
app.get('/api/admin/history', (req, res) => {
    db.all('SELECT * FROM HistoryLog ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Export Excel
app.get('/api/export', async (req, res) => {
    const { department } = req.query; // 'ALL' or specific department
    
    let sql = "SELECT * FROM OrdersCart WHERE status != 'ไม่อนุมัติ'";
    let params = [];
    if (department && department !== 'ALL') {
        sql += " AND department = ?";
        params.push(department);
    }
    sql += " ORDER BY tab_category, activity_id, term DESC";

    try {
        db.all(sql, params, async (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            const workbook = new ExcelJS.Workbook();
            const isAdmin = department === 'ALL';
            
            const createSheet = (name, type) => {
                const sheet = workbook.addWorksheet(name);
                let headers = [];
                if (type === 'Activities') {
                    headers = isAdmin 
                        ? ['กลุ่มงาน', 'รหัสกิจกรรม', 'ชื่อกิจกรรม', 'รายการ', 'จำนวน', 'หน่วย', 'ราคาต่อหน่วย', 'หมวดวัสดุ', 'หมวดค่าใช้สอย', 'หมวดค่าตอบแทน', 'หมวดครุภัณฑ์', 'ยอดเงินรวม']
                        : ['รหัสกิจกรรม', 'ชื่อกิจกรรม', 'รายการ', 'จำนวน', 'หน่วย', 'ราคาต่อหน่วย', 'หมวดวัสดุ', 'หมวดค่าใช้สอย', 'หมวดค่าตอบแทน', 'หมวดครุภัณฑ์', 'ยอดเงินรวม'];
                } else {
                    headers = isAdmin
                        ? ['กลุ่มงาน', 'ลำดับที่', 'รายการ', 'จำนวน', 'หน่วย', 'ราคาต่อหน่วย', 'หมวดวัสดุ', 'หมวดค่าใช้สอย', 'หมวดค่าตอบแทน', 'หมวดครุภัณฑ์', 'ยอดเงินรวม']
                        : ['ลำดับที่', 'รายการ', 'จำนวน', 'หน่วย', 'ราคาต่อหน่วย', 'หมวดวัสดุ', 'หมวดค่าใช้สอย', 'หมวดค่าตอบแทน', 'หมวดครุภัณฑ์', 'ยอดเงินรวม'];
                }
                sheet.addRow(headers).font = { bold: true };
                return sheet;
            };

            const sheets = {
                'Activities': createSheet('กิจกรรม', 'Activities'),
                'Office Supplies': createSheet('วัสดุสำนักงาน', 'Other'),
                'Technology': createSheet('เทคโนโลยี', 'Other')
            };

            const getBudgets = (row, activeQty) => {
                const t = activeQty * row.price;
                return [
                    row.budget_type === 'วัสดุ' ? t : '',
                    row.budget_type === 'ค่าใช้สอย' ? t : '',
                    row.budget_type === 'ค่าตอบแทน' ? t : '',
                    row.budget_type === 'ครุภัณฑ์' ? t : '',
                    t
                ];
            };

            // Grouping state
            let currentCategory = null;
            let currentActivity = null;
            let currentTerm = null;
            let currentTab = null;
            let subtotal = [0, 0, 0, 0, 0];
            const grandTotals = {
                'Activities': [0,0,0,0,0],
                'Office Supplies': [0,0,0,0,0],
                'Technology': [0,0,0,0,0]
            };
            let itemIndex = 1;

            const printSubtotal = (sheet, label, type) => {
                if (subtotal[4] > 0) {
                    let padding = type === 'Activities' ? (isAdmin ? 6 : 5) : (isAdmin ? 5 : 4);
                    let rowData = new Array(padding).fill('');
                    rowData.push(label);
                    rowData = rowData.concat(subtotal);
                    sheet.addRow(rowData).font = { bold: true };
                    subtotal = [0, 0, 0, 0, 0];
                }
            };

            rows.forEach(row => {
                const sheet = sheets[row.tab_category];
                if (!sheet) return;

                const activeQty = row.status === 'รอพิจารณา' ? row.qty_requested : row.qty_approved;
                const budgets = getBudgets(row, activeQty);
                
                if (currentTab !== row.tab_category) {
                    if (currentTab === 'Activities') {
                        if (currentActivity) printSubtotal(sheets['Activities'], 'รวมเงิน ' + currentActivity + ' (' + currentTerm + ')', 'Activities');
                    } else if (currentTab === 'Office Supplies' || currentTab === 'Technology') {
                        if (currentCategory) printSubtotal(sheets[currentTab], 'รวมเงิน เทอม ' + currentTerm, 'Other');
                    }
                    currentTab = row.tab_category;
                    currentActivity = null;
                    currentCategory = null;
                    currentTerm = null;
                    itemIndex = 1;
                }

                if (row.tab_category === 'Activities') {
                    if (currentActivity !== row.activity_id || currentTerm !== row.term) {
                        if (currentActivity) printSubtotal(sheet, 'รวมเงิน ' + currentActivity + ' (' + currentTerm + ')', 'Activities');
                        currentActivity = row.activity_id;
                        currentTerm = row.term;
                        // Print Term Header
                        sheet.addRow([row.term]).font = { bold: true, color: { argb: 'FF0000FF' } };
                    }
                    
                    let r = isAdmin 
                        ? [row.department, row.activity_id, row.activity, row.item_name, activeQty, row.unit, row.price]
                        : [row.activity_id, row.activity, row.item_name, activeQty, row.unit, row.price];
                    sheet.addRow(r.concat(budgets));
                } else {
                    if (currentCategory !== row.tab_category || currentTerm !== row.term) {
                        if (currentCategory) printSubtotal(sheets[currentCategory], 'รวมเงิน เทอม ' + currentTerm, 'Other');
                        currentCategory = row.tab_category;
                        currentTerm = row.term;
                        itemIndex = 1;
                        sheet.addRow([row.term]).font = { bold: true, color: { argb: 'FF0000FF' } };
                    }
                    
                    let r = isAdmin
                        ? [row.department, itemIndex++, row.item_name, activeQty, row.unit, row.price]
                        : [itemIndex++, row.item_name, activeQty, row.unit, row.price];
                    sheet.addRow(r.concat(budgets));
                }

                for(let i=0; i<5; i++) {
                    subtotal[i] += (budgets[i] || 0);
                    grandTotals[row.tab_category][i] += (budgets[i] || 0);
                }
            });

            // Print final subtotals for the last tab
            if (currentTab === 'Activities' && currentActivity) {
                printSubtotal(sheets['Activities'], 'รวมเงิน ' + currentActivity + ' (' + currentTerm + ')', 'Activities');
            } else if ((currentTab === 'Office Supplies' || currentTab === 'Technology') && currentCategory) {
                printSubtotal(sheets[currentTab], 'รวมเงิน เทอม ' + currentTerm, 'Other');
            }

            // Print Grand Totals
            if (sheets['Activities'].rowCount > 1) {
                let padding = isAdmin ? 6 : 5;
                let r = new Array(padding).fill('');
                r.push('รวมทั้งสิ้น');
                sheets['Activities'].addRow(r.concat(grandTotals['Activities'])).font = { bold: true, color: { argb: 'FFFF0000' } };
            }
            if (sheets['Office Supplies'].rowCount > 1) {
                let padding = isAdmin ? 5 : 4;
                let r = new Array(padding).fill('');
                r.push('รวมทั้งสิ้น');
                sheets['Office Supplies'].addRow(r.concat(grandTotals['Office Supplies'])).font = { bold: true, color: { argb: 'FFFF0000' } };
            }
            if (sheets['Technology'].rowCount > 1) {
                let padding = isAdmin ? 5 : 4;
                let r = new Array(padding).fill('');
                r.push('รวมทั้งสิ้น');
                sheets['Technology'].addRow(r.concat(grandTotals['Technology'])).font = { bold: true, color: { argb: 'FFFF0000' } };
            }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="BudgetExport.xlsx"');
            await workbook.xlsx.write(res);
            res.end();
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fallback for React Router
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
