import ExcelJS from 'exceljs';

const FONT = { name: 'TH Sarabun PSK', size: 14 };
const FONT_BOLD = { name: 'TH Sarabun PSK', size: 14, bold: true };

const applyFont = (row, bold = false) => {
  row.eachCell({ includeEmpty: true }, cell => {
    cell.font = bold ? FONT_BOLD : FONT;
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
};

const NUM_FMT = '#,##0';

const generateSheet = (wb, sheetName, tabOrders, actData) => {
  if (tabOrders.length === 0) return;

  // Truncate sheet name to 31 chars and remove invalid chars
  let safeName = sheetName.replace(/[\\/?*[\]:]/g, '').substring(0, 31);
  const ws = wb.addWorksheet(safeName);

  // Column definitions: A–L
  ws.columns = [
    { key: 'term',        width: 12 },
    { key: 'dept',        width: 28 },
    { key: 'actId',       width: 16 },
    { key: 'actName',     width: 42 },
    { key: 'item',        width: 42 },
    { key: 'budgetType',  width: 16 },
    { key: 'qty',         width: 10 },
    { key: 'unit',        width: 12 },
    { key: 'price',       width: 14 },
    { key: 'total',       width: 16 },
    { key: 'status',      width: 16 },
    { key: 'remark',      width: 22 },
  ];

  // Header row
  const headerRow = ws.addRow([
    'ภาคเรียน', 'กลุ่มงาน', 'รหัสกิจกรรม', 'ชื่อกิจกรรม',
    'รายการ', 'ประเภทงบ', 'จำนวน', 'หน่วยนับ', 'ราคา/หน่วย',
    'ยอดรวม (บาท)', 'สถานะ', 'หมายเหตุ',
  ]);
  applyFont(headerRow, true);
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });

  let grandTotal = 0, totalT1 = 0, totalT2 = 0;

  // Sort by term then activity_id
  tabOrders.sort((a, b) => {
    if (a.term !== b.term) return a.term === '2/2569' ? -1 : 1;
    return (a.activity_id || '').localeCompare(b.activity_id || '');
  });

  // Group by activity
  const grouped = tabOrders.reduce((acc, o) => {
    const key = o.activity_id || '-';
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  Object.keys(grouped).forEach(actId => {
    const items = grouped[actId];
    let actTotal = 0, actT1 = 0, actT2 = 0;

    const actName = actId !== '-'
      ? (actData.find(a => a.activity_id === actId)?.activity || items[0].activity || '')
      : '';

    items.forEach(o => {
      const activeQty = o.status === 'รอพิจารณา' ? o.qty_requested : (o.status === 'ไม่อนุมัติ' ? 0 : o.qty_approved);
      const lineTotal = o.price * activeQty;

      actTotal += lineTotal;
      grandTotal += lineTotal;
      if (o.term === '2/2569') { totalT1 += lineTotal; actT1 += lineTotal; }
      if (o.term === '1/2570') { totalT2 += lineTotal; actT2 += lineTotal; }

      const dataRow = ws.addRow([
        o.term,
        o.department,
        o.activity_id !== '-' ? o.activity_id : '',
        actName,
        o.item_name,
        o.budget_type,
        activeQty,
        o.unit,
        o.price,
        lineTotal,
        o.status,
        o.remark || '',
      ]);
      applyFont(dataRow);
      // Format numbers
      dataRow.getCell('qty').numFmt   = NUM_FMT;
      dataRow.getCell('price').numFmt = NUM_FMT;
      dataRow.getCell('total').numFmt = NUM_FMT;
    });

    // Subtotals for this activity
    if (actId !== '-' && items.length > 0) {
      const addSubtotal = (label, val) => {
        const r = ws.addRow(['', '', '', label, '', '', '', '', '', val, '', '']);
        applyFont(r, true);
        r.getCell('total').numFmt = NUM_FMT;
        r.getCell('total').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      };
      if (actT1 > 0 && actT2 > 0) {
        addSubtotal(`รวมยอดภาคเรียน 2/2569`, actT1);
        addSubtotal(`รวมยอดภาคเรียน 1/2570`, actT2);
      }
      addSubtotal(`รวมยอดกิจกรรม ${actId}`, actTotal);
      ws.addRow([]); // blank row
    }
  });

  // Grand totals
  ws.addRow([]);
  const addTotal = (label, val, color) => {
    const r = ws.addRow(['', '', '', label, '', '', '', '', '', val, '', '']);
    applyFont(r, true);
    r.getCell('total').numFmt = NUM_FMT;
    r.getCell('total').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  };
  addTotal('รวมยอดภาคเรียน 2/2569',       totalT1,    'FFDCE6F1');
  addTotal('รวมยอดภาคเรียน 1/2570',       totalT2,    'FFDCE6F1');
  addTotal('รวมยอดทั้งสิ้น (2 ภาคเรียน)', grandTotal, 'FFFFE0E0');
};

export const exportBudgetToExcel = async (ordersData, actData, fileName) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Budget70';
  wb.created = new Date();

  // Activities – split by activities.budget_type
  const activityOrders = ordersData.filter(o => o.tab_category === 'Activities');
  const groupedByBudget = activityOrders.reduce((acc, o) => {
    const info = actData.find(a => a.activity_id === o.activity_id);
    const bt = info?.budget_type || 'ไม่ระบุประเภทงบ';
    if (!acc[bt]) acc[bt] = [];
    acc[bt].push(o);
    return acc;
  }, {});

  Object.keys(groupedByBudget).forEach(bt => {
    const nameWithoutNumber = bt.replace(/^\d+\./, '');
    generateSheet(wb, `กิจกรรม(${nameWithoutNumber})`, groupedByBudget[bt], actData);
  });

  // Office Supplies
  const officeOrders = ordersData.filter(o => o.tab_category === 'Office Supplies');
  if (officeOrders.length > 0) generateSheet(wb, 'วัสดุสำนักงาน', officeOrders, actData);

  // Technology
  const techOrders = ordersData.filter(o => o.tab_category === 'Technology');
  if (techOrders.length > 0) generateSheet(wb, 'เทคโนโลยี', techOrders, actData);

  if (wb.worksheets.length === 0) {
    const ws = wb.addWorksheet('Data');
    ws.addRow(['ไม่มีข้อมูล']);
  }

  // Write to buffer and trigger download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
