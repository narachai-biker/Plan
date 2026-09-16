import * as XLSX from 'xlsx';

export const exportBudgetToExcel = (ordersData, actData, fileName) => {
  const wb = XLSX.utils.book_new();

  const generateSheet = (sheetName, tabOrders, wb) => {
    if (tabOrders.length === 0) return;
    const wsData = [];
    
    // Header
    wsData.push([
      'ภาคเรียน', 'กลุ่มงาน', 'รหัสกิจกรรม', 'ชื่อกิจกรรม', 
      'รายการ', 'ประเภทงบ', 'ราคา/หน่วย', 'จำนวน', 'หน่วยนับ',
      'ยอดรวม (บาท)', 'สถานะ', 'หมายเหตุ'
    ]);

    let grandTotal = 0;
    let totalT1 = 0; // Term 2/2569
    let totalT2 = 0; // Term 1/2570

    // Sort items by term first, then by activity
    tabOrders.sort((a, b) => {
      if (a.term !== b.term) {
        if (a.term === '2/2569') return -1;
        if (b.term === '2/2569') return 1;
        return 0;
      }
      return (a.activity_id || '').localeCompare(b.activity_id || '');
    });

    const grouped = tabOrders.reduce((acc, o) => {
      const actId = o.activity_id || '-';
      if (!acc[actId]) acc[actId] = [];
      acc[actId].push(o);
      return acc;
    }, {});

    Object.keys(grouped).forEach(actId => {
      const items = grouped[actId];
      let activityTotal = 0;
      let actT1 = 0;
      let actT2 = 0;
      
      const actName = actId !== '-' 
        ? (actData.find(a => a.activity_id === actId)?.activity || items[0].activity || '') 
        : '';

      items.forEach(o => {
        const activeQty = o.status === 'รอพิจารณา' ? o.qty_requested : (o.status === 'ไม่อนุมัติ' ? 0 : o.qty_approved);
        const lineTotal = o.price * activeQty;
        
        activityTotal += lineTotal;
        grandTotal += lineTotal;
        
        if (o.term === '2/2569') {
          totalT1 += lineTotal;
          actT1 += lineTotal;
        }
        if (o.term === '1/2570') {
          totalT2 += lineTotal;
          actT2 += lineTotal;
        }

        wsData.push([
          o.term,
          o.department,
          o.activity_id !== '-' ? o.activity_id : '',
          actName,
          o.item_name,
          o.budget_type,
          o.price,
          activeQty,
          o.unit,
          lineTotal,
          o.status,
          o.remark || ''
        ]);
      });

      // Activity subtotal
      if (actId !== '-' && items.length > 0) {
        if (actT1 > 0 && actT2 > 0) {
          wsData.push(['', '', '', `รวมยอดภาคเรียน 2/2569`, '', '', '', '', '', actT1, '', '']);
          wsData.push(['', '', '', `รวมยอดภาคเรียน 1/2570`, '', '', '', '', '', actT2, '', '']);
          wsData.push(['', '', '', `รวมยอดกิจกรรม ${actId}`, '', '', '', '', '', activityTotal, '', '']);
        } else {
          wsData.push(['', '', '', `รวมยอดกิจกรรม ${actId}`, '', '', '', '', '', activityTotal, '', '']);
        }
        wsData.push([]);
      }
    });

    // Term subtotals & Grand total
    wsData.push([]);
    wsData.push(['', '', '', 'รวมยอดภาคเรียน 2/2569', '', '', '', '', '', totalT1, '', '']);
    wsData.push(['', '', '', 'รวมยอดภาคเรียน 1/2570', '', '', '', '', '', totalT2, '', '']);
    wsData.push(['', '', '', 'รวมยอดทั้งสิ้น (2 ภาคเรียน)', '', '', '', '', '', grandTotal, '', '']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto-size columns
    const colWidths = [
      {wch: 10}, {wch: 25}, {wch: 15}, {wch: 40}, 
      {wch: 40}, {wch: 15}, {wch: 12}, {wch: 12}, {wch: 10},
      {wch: 15}, {wch: 15}, {wch: 20}
    ];
    ws['!cols'] = colWidths;

    // Add comma formatting to numbers (no decimals)
    Object.keys(ws).forEach(key => {
      if (key.startsWith('!')) return;
      const colMatch = key.match(/^[A-Z]+/);
      if (!colMatch) return;
      const col = colMatch[0];
      
      // G = ราคา/หน่วย, H = จำนวน, J = ยอดรวม (Indices shifted by -1 after H)
      if (col === 'G' || col === 'H' || col === 'J') {
        if (ws[key] && typeof ws[key].v === 'number') {
          ws[key].z = '#,##0'; // No decimals
        }
      }
    });

    // Handle sheet name length limit (31 chars)
    let safeName = sheetName.replace(/[\\/?*[\]]/g, ''); // Remove invalid chars
    if (safeName.length > 31) safeName = safeName.substring(0, 31);

    XLSX.utils.book_append_sheet(wb, ws, safeName);
  };

  // Process Activities (Split by budget_type)
  const activityOrders = ordersData.filter(o => o.tab_category === 'Activities');
  const groupedByBudget = activityOrders.reduce((acc, o) => {
    const bt = o.budget_type || 'ไม่ระบุประเภทงบ';
    if (!acc[bt]) acc[bt] = [];
    acc[bt].push(o);
    return acc;
  }, {});

  Object.keys(groupedByBudget).forEach(bt => {
    const nameWithoutNumber = bt.replace(/^\d+\./, ''); // e.g. "1.ค่าจัดการเรียนการสอน" -> "ค่าจัดการเรียนการสอน"
    const sheetName = `กิจกรรม(${nameWithoutNumber})`;
    generateSheet(sheetName, groupedByBudget[bt], wb);
  });

  // Process Office Supplies
  const officeOrders = ordersData.filter(o => o.tab_category === 'Office Supplies');
  if (officeOrders.length > 0) generateSheet('วัสดุสำนักงาน', officeOrders, wb);

  // Process Technology
  const techOrders = ordersData.filter(o => o.tab_category === 'Technology');
  if (techOrders.length > 0) generateSheet('เทคโนโลยี', techOrders, wb);

  if (wb.SheetNames.length === 0) {
     // If completely empty, just create an empty sheet
     const ws = XLSX.utils.aoa_to_sheet([['ไม่มีข้อมูล']]);
     XLSX.utils.book_append_sheet(wb, ws, 'Data');
  }

  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
