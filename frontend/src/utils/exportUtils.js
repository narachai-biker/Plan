import * as XLSX from 'xlsx';

export const exportBudgetToExcel = (ordersData, actData, fileName) => {
  const wb = XLSX.utils.book_new();

  const tabs = [
    { name: 'กิจกรรม', category: 'Activities' },
    { name: 'วัสดุสำนักงาน', category: 'Office Supplies' },
    { name: 'เทคโนโลยี', category: 'Technology' }
  ];

  tabs.forEach(tab => {
    const tabOrders = ordersData.filter(o => o.tab_category === tab.category);
    
    const wsData = [];
    
    // Header
    wsData.push([
      'ภาคเรียน', 'กลุ่มงาน', 'รหัสกิจกรรม', 'ชื่อกิจกรรม', 
      'รายการ', 'ประเภทงบ', 'ราคา/หน่วย', 'จำนวนที่ขอ', 'จำนวนที่อนุมัติ', 'หน่วยนับ',
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
      
      const actName = actId !== '-' 
        ? (actData.find(a => a.activity_id === actId)?.activity || items[0].activity || '') 
        : '';

      items.forEach(o => {
        const activeQty = o.status === 'รอพิจารณา' ? o.qty_requested : (o.status === 'ไม่อนุมัติ' ? 0 : o.qty_approved);
        const lineTotal = o.price * activeQty;
        
        activityTotal += lineTotal;
        grandTotal += lineTotal;
        if (o.term === '2/2569') totalT1 += lineTotal;
        if (o.term === '1/2570') totalT2 += lineTotal;

        wsData.push([
          o.term,
          o.department,
          o.activity_id !== '-' ? o.activity_id : '',
          actName,
          o.item_name,
          o.budget_type,
          o.price,
          o.qty_requested,
          o.qty_approved,
          o.unit,
          lineTotal,
          o.status,
          o.remark || ''
        ]);
      });

      // Activity subtotal
      if (actId !== '-' && items.length > 0) {
        wsData.push(['', '', '', `รวมยอดกิจกรรม ${actId}`, '', '', '', '', '', '', activityTotal, '', '']);
        wsData.push([]);
      }
    });

    // Term subtotals & Grand total
    wsData.push([]);
    wsData.push(['', '', '', 'รวมยอดภาคเรียน 2/2569', '', '', '', '', '', '', totalT1, '', '']);
    wsData.push(['', '', '', 'รวมยอดภาคเรียน 1/2570', '', '', '', '', '', '', totalT2, '', '']);
    wsData.push(['', '', '', 'รวมยอดทั้งสิ้น (2 ภาคเรียน)', '', '', '', '', '', '', grandTotal, '', '']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto-size columns
    const colWidths = [
      {wch: 10}, {wch: 25}, {wch: 15}, {wch: 40}, 
      {wch: 40}, {wch: 15}, {wch: 12}, {wch: 12}, {wch: 15}, {wch: 10},
      {wch: 15}, {wch: 15}, {wch: 20}
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, tab.name);
  });

  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
