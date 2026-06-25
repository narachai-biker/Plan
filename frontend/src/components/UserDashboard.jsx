import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, Save, FileDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

export default function UserDashboard() {
  const { user } = useAuth();
  
  // Department parsing
  const isPlan = user.username === 'plan';
  const defaultDepartments = user.department ? user.department.split(',').map(d => d.trim()) : [];
  const [selectedDept, setSelectedDept] = useState(defaultDepartments[0] || '');
  const [allDepartments, setAllDepartments] = useState([]);

  const [activeTab, setActiveTab] = useState('Activities');
  const [activities, setActivities] = useState([]);
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [departmentLocks, setDepartmentLocks] = useState([]);
  const [systemStatus, setSystemStatus] = useState('open');
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Add Modal State
  const [term, setTerm] = useState('2/2569');
  const [modalCategory, setModalCategory] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [qty, setQty] = useState(1);
  const [remark, setRemark] = useState('');
  
  const [isOther, setIsOther] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customBudgetType, setCustomBudgetType] = useState('');

  // Edit Modal State
  const [editItem, setEditItem] = useState(null);

  const fetchData = async () => {
    const [{ data: actData }, { data: prodData }, { data: reqData }, { data: lockData }, { data: sysData }] = await Promise.all([
      supabase.from('activities').select('*'),
      supabase.from('productcatalog').select('*'),
      supabase.from('orderscart').select('*'),
      supabase.from('departmentlocks').select('*'),
      supabase.from('systemsettings').select('*').eq('key', 'system_status').single()
    ]);

    if (actData) {
      setActivities(actData);
      const uniqueDepts = [...new Set(actData.map(a => a.department))].sort();
      setAllDepartments(uniqueDepts);
      if (isPlan && !selectedDept && uniqueDepts.length > 0) {
        setSelectedDept(uniqueDepts[0]);
      }
    }
    if (prodData) setProducts(prodData);
    if (reqData) setRequests(reqData);
    if (lockData) {
      setDepartmentLocks(lockData);
    }
    if (sysData) setSystemStatus(sysData.value);
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept, isPlan]);

  const deptActivities = activities.filter(a => a.department === selectedDept);
  
  // Extract unique categories for the dropdown
  const getAvailableCategories = () => {
    const allCats = [...new Set(products.map(p => p.category))];
    if (activeTab === 'Technology') {
      return allCats.filter(c => c === 'หมวดหมึกและอุปกรณ์คอม' || c === 'ครุภัณฑ์คอมพิวเตอร์');
    } else {
      return allCats.filter(c => c !== 'หมวดหมึกและอุปกรณ์คอม' && c !== 'ครุภัณฑ์คอมพิวเตอร์');
    }
  };

  const getFilteredProducts = () => {
    return products.filter(p => p.category === modalCategory);
  };

  const handleItemSelect = (val) => {
    setSelectedItem(val);
    if (val === 'OTHER') {
      setIsOther(true);
      setCustomPrice('');
      setCustomUnit('');
      setCustomBudgetType('');
    } else {
      setIsOther(false);
      const prod = products.find(p => p.id.toString() === val);
      if (prod) {
        setCustomPrice(prod.price);
        setCustomUnit(prod.unit);
        setCustomBudgetType(prod.budget_type);
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'Activities' && !selectedActivity) return alert("กรุณาเลือกกิจกรรม");
    if (isOther && !customBudgetType) return alert("กรุณาเลือกประเภทงบสำหรับรายการอื่นๆ");

    const actData = activeTab === 'Activities' ? activities.find(a => a.activity_id === selectedActivity) : null;
    
    const requestData = {
      order_id: 'ORD-' + Date.now() + Math.floor(Math.random()*1000),
      username: user.username,
      department: selectedDept,
      tab_category: activeTab,
      term,
      activity_id: activeTab === 'Activities' ? selectedActivity : '-',
      project: actData?.project || '-',
      activity: actData?.activity || '-',
      item_name: isOther ? customName : products.find(p => p.id.toString() === selectedItem).item_name,
      budget_type: customBudgetType,
      unit: customUnit,
      price: parseFloat(customPrice),
      qty_requested: parseInt(qty),
      qty_approved: 0,
      status: 'รอพิจารณา',
      remark: remark
    };

    try {
      const { error } = await supabase.from('orderscart').insert([requestData]);
      if (!error) {
        setIsAddOpen(false);
        fetchData();
      } else {
        throw new Error(error.message);
      }
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('orderscart')
        .update({
          qty_requested: parseInt(editItem.qty_requested),
          remark: editItem.remark
        })
        .eq('id', editItem.id);

      if (error) throw new Error(error.message);

      const old_qty = requests.find(r => r.id === editItem.id).qty_requested;
      const historyLog = {
        order_id: editItem.order_id,
        department: editItem.department,
        admin_name: user.username,
        term: editItem.term,
        tab_category: editItem.tab_category,
        activity_id: editItem.activity_id,
        project: editItem.project,
        item_name: editItem.item_name,
        old_qty: old_qty,
        new_qty: parseInt(editItem.qty_requested),
        old_total: old_qty * editItem.price,
        new_total: parseInt(editItem.qty_requested) * editItem.price,
        status: 'ผู้ใช้แก้ไขรายการ',
        remark: editItem.remark
      };
      await supabase.from('historylog').insert([historyLog]);

      setIsEditOpen(false);
      fetchData();
    } catch (err) {
      alert("Error updating: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) return;
    try {
      const item = requests.find(r => r.id === id);
      const { error } = await supabase.from('orderscart').delete().eq('id', id);
      if (error) throw new Error(error.message);

      const historyLog = {
        order_id: item.order_id,
        department: item.department,
        admin_name: user.username,
        term: item.term,
        tab_category: item.tab_category,
        activity_id: item.activity_id,
        project: item.project,
        item_name: item.item_name,
        old_qty: item.qty_requested,
        new_qty: 0,
        old_total: item.qty_requested * item.price,
        new_total: 0,
        status: 'ผู้ใช้ลบรายการ',
        remark: item.remark
      };
      await supabase.from('historylog').insert([historyLog]);

      fetchData();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  const lock = departmentLocks.find(l => l.department === selectedDept);
  const unlocked = lock ? lock.is_unlocked === 1 : (systemStatus === 'open');
  const canAdd = isPlan || unlocked;

  const isLocked = (itemStatus) => {
    if (unlocked) return false;
    return itemStatus !== 'รอพิจารณา';
  };

  // Filter cart for current department & active tab
  let visibleCart = requests.filter(r => r.department === selectedDept && r.tab_category === activeTab);
  
  // Sort by term (2/2569 before 1/2570)
  visibleCart = visibleCart.sort((a, b) => {
    if (a.term === '2/2569' && b.term !== '2/2569') return -1;
    if (b.term === '2/2569' && a.term !== '2/2569') return 1;
    return 0;
  });

  const handleExportExcel = async () => {
    try {
      const { data: ordersData } = await supabase.from('orderscart').select('*').eq('department', selectedDept);
      const { data: actData } = await supabase.from('activities').select('*').eq('department', selectedDept);
      
      if (!ordersData || ordersData.length === 0) {
        alert('ไม่มีข้อมูลสำหรับส่งออก');
        return;
      }

      const excelData = ordersData.map(o => {
        const act = actData ? actData.find(a => a.activity_id === o.activity_id) : null;
        return {
          'ภาคเรียน': o.term,
          'กลุ่มงาน': o.department,
          'หมวดหมู่': o.tab_category === 'Activities' ? 'กิจกรรม' : o.tab_category === 'Office Supplies' ? 'วัสดุสำนักงาน' : 'เทคโนโลยี',
          'รหัสกิจกรรม': o.activity_id !== '-' ? o.activity_id : '',
          'ชื่อกิจกรรม': act ? act.activity : o.activity !== '-' ? o.activity : '',
          'รายการ': o.item_name,
          'ประเภทงบ': o.budget_type,
          'ราคา/หน่วย': o.price,
          'จำนวนที่ขอ': o.qty_requested,
          'จำนวนที่อนุมัติ': o.qty_approved,
          'หน่วยนับ': o.unit,
          'สถานะ': o.status,
          'หมายเหตุ': o.remark || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      XLSX.writeFile(wb, `budget_export_${selectedDept}.xlsx`);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการส่งออก Excel');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
      
      {/* Department Selector */}
      <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>กลุ่มสาระ/กลุ่มงานที่ใช้งาน:</h3>
          <select 
            className="form-control" 
            value={selectedDept} 
            onChange={e => setSelectedDept(e.target.value)}
            style={{ maxWidth: '400px', fontWeight: 'bold', color: 'var(--primary)' }}
          >
            {(isPlan && allDepartments.length > 0 ? allDepartments : defaultDepartments).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
      </div>

      <div className="tabs">
        {['Activities', 'Office Supplies', 'Technology'].map(tab => (
          <button 
            key={tab} 
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'Activities' ? 'กิจกรรม' : tab === 'Office Supplies' ? 'วัสดุสำนักงาน' : 'เทคโนโลยี'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>รายการตะกร้า ({visibleCart.length})</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={handleExportExcel}>
            <FileDown size={18} /> นำออก Excel
          </button>
          {canAdd && (
            <button className="btn btn-primary" onClick={() => {
              setModalCategory(''); setSelectedItem(''); setIsOther(false); setQty(1); setRemark('');
              setCustomPrice(''); setCustomUnit(''); setCustomBudgetType(''); setCustomName('');
              setIsAddOpen(true);
            }}>
              <Plus size={18} /> เพิ่มรายการสินค้า
            </button>
          )}
        </div>
      </div>

      {!canAdd && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #f87171' }}>
          <strong>🔒 ระบบปิดรับคำขอ:</strong> หมดเขตเวลาการขอตั้งงบประมาณแล้ว (คุณสามารถดูรายการที่ขอได้เท่านั้น)
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ภาคเรียน</th>
              <th>กิจกรรม</th>
              <th>รายการ</th>
              <th>ประเภทงบ</th>
              <th>ราคา/หน่วย</th>
              <th>จำนวน</th>
              <th>ยอดรวม</th>
              <th>หมายเหตุ</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {visibleCart.length === 0 ? (
              <tr><td colSpan="10" style={{textAlign: 'center', padding: '32px', color: 'var(--text-muted)'}}>ไม่มีรายการในตะกร้าสำหรับหมวดหมู่นี้</td></tr>
            ) : visibleCart.map(item => {
              const locked = isLocked(item.status);
              const isRejected = item.status === 'ไม่อนุมัติ';
              const isEdited = item.status === 'แก้ไข';
              
              return (
                <tr key={item.id} style={{ 
                  background: isEdited ? '#fffbeb' : 'inherit',
                  opacity: isRejected ? 0.6 : 1
                }}>
                  <td>{item.term}</td>
                  <td title={item.activity}>{item.activity_id !== '-' ? `[${item.activity_id}]` : '-'}</td>
                  <td>{item.item_name}</td>
                  <td><span className="badge" style={{ background: '#e2e8f0', color: '#475569' }}>{item.budget_type}</span></td>
                  <td>{item.price.toLocaleString()}</td>
                  <td>{item.qty_requested} {item.unit}</td>
                  <td style={{ fontWeight: 'bold' }}>{(item.price * item.qty_requested).toLocaleString()}</td>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.remark}>{item.remark || '-'}</td>
                  <td>
                    <span className={`badge`} style={{
                      background: isRejected ? '#fee2e2' : isEdited ? '#fef3c7' : item.status === 'อนุมัติ' ? '#dcfce7' : '#e0e7ff',
                      color: isRejected ? '#991b1b' : isEdited ? '#92400e' : item.status === 'อนุมัติ' ? '#166534' : '#3730a3'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {!locked ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => { setEditItem(item); setIsEditOpen(true); }}><Edit2 size={14}/></button>
                        <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(item.id)}><Trash2 size={14}/></button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locked</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2>เพิ่มรายการสินค้า ({activeTab})</h2>
              <button onClick={() => setIsAddOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24}/></button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">ภาคเรียน</label>
                  <select className="form-control" value={term} onChange={e => setTerm(e.target.value)}>
                    <option value="2/2569">2/2569</option>
                    <option value="1/2570">1/2570</option>
                  </select>
                </div>
                {activeTab === 'Activities' && (
                  <div className="form-group">
                    <label className="form-label">กิจกรรมที่ขอ (ของ {selectedDept})</label>
                    <select className="form-control" value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)} required>
                      <option value="">-- เลือกกิจกรรม --</option>
                      {deptActivities.map(a => <option key={a.id} value={a.activity_id}>[{a.activity_id}] {a.activity}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">หมวดหมู่</label>
                  <select className="form-control" value={modalCategory} onChange={e => { 
                    const val = e.target.value;
                    setModalCategory(val); 
                    setSelectedItem('');
                    if (val === 'OTHER') {
                      setIsOther(true);
                      setCustomPrice('');
                      setCustomUnit('');
                      setCustomBudgetType('');
                    } else {
                      setIsOther(false);
                    }
                  }} required>
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {getAvailableCategories().map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="OTHER">อื่นๆ (ระบุเอง)</option>
                  </select>
                </div>
                {!isOther && (
                  <div className="form-group">
                    <label className="form-label">รายการสินค้า</label>
                    <select className="form-control" value={selectedItem} onChange={e => handleItemSelect(e.target.value)} required={!isOther} disabled={!modalCategory || isOther}>
                      <option value="">-- เลือกรายการ --</option>
                      {getFilteredProducts().map(p => <option key={p.id} value={p.id}>{p.item_name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {isOther && (
                <div className="form-group">
                  <label className="form-label">ชื่อรายการ (อื่นๆ)</label>
                  <input type="text" className="form-control" value={customName} onChange={e => setCustomName(e.target.value)} required />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', background: 'var(--surface-hover)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">หน่วยนับ</label>
                  <input type="text" className="form-control" value={customUnit} onChange={e => setCustomUnit(e.target.value)} readOnly={!isOther} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ราคา/หน่วย</label>
                  <input type="number" className="form-control" value={customPrice} onChange={e => setCustomPrice(e.target.value)} readOnly={!isOther} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ประเภทงบ</label>
                  <select className="form-control" value={customBudgetType} onChange={e => setCustomBudgetType(e.target.value)} disabled={!isOther} required>
                    <option value="">-- เลือก --</option>
                    <option value="วัสดุ">วัสดุ</option>
                    <option value="ค่าใช้สอย">ค่าใช้สอย</option>
                    <option value="ค่าตอบแทน">ค่าตอบแทน</option>
                    <option value="ครุภัณฑ์">ครุภัณฑ์</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">จำนวน (Quantity)</label>
                  <input type="number" className="form-control" value={qty} onChange={e => setQty(e.target.value)} min="1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">หมายเหตุ</label>
                  <input type="text" className="form-control" value={remark} onChange={e => setRemark(e.target.value)} placeholder="เช่น สี, ขนาด, URL" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  ยอดรวม: ฿{((parseFloat(customPrice) || 0) * (parseInt(qty) || 0)).toLocaleString()}
                </div>
                <button type="submit" className="btn btn-primary"><Save size={18}/> บันทึกรายการ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editItem && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2>แก้ไขรายการ</h2>
              <button onClick={() => setIsEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '16px', fontWeight: 'bold' }}>{editItem.item_name}</div>
              <div className="form-group">
                <label className="form-label">จำนวน</label>
                <input type="number" className="form-control" value={editItem.qty_requested} onChange={e => setEditItem({...editItem, qty_requested: e.target.value})} min="1" required />
              </div>
              <div className="form-group">
                <label className="form-label">หมายเหตุ</label>
                <input type="text" className="form-control" value={editItem.remark} onChange={e => setEditItem({...editItem, remark: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}><Save size={18}/> บันทึกการแก้ไข</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
