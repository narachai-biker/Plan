import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard or consideration
  
  // Dashboard states
  const [budgetCategory, setBudgetCategory] = useState('1'); // 1, 2, 3
  const [dashboardData, setDashboardData] = useState([]);
  const [systemStatus, setSystemStatus] = useState('open');

  // Consideration states
  const [activitiesList, setActivitiesList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentLocks, setDepartmentLocks] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [considerTab, setConsiderTab] = useState('Activities'); // Activities, Office Supplies, Technology
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilterDept, setHistoryFilterDept] = useState('');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
      fetchSystemStatus();
    } else {
      fetchDepartments();
      fetchHistory();
    }
  }, [activeTab, budgetCategory]);

  useEffect(() => {
    if (activeTab === 'consideration' && selectedDept) {
      fetchOrders();
    }
  }, [selectedDept, considerTab]);

  const fetchDashboard = async () => {
    const res = await fetch(`/api/admin/dashboard?budgetCategory=${budgetCategory}`);
    const data = await res.json();
    setDashboardData(data);
  };

  const fetchSystemStatus = async () => {
    const res = await fetch(`/api/settings/system_status`);
    const data = await res.json();
    setSystemStatus(data.status);
  };

  const toggleSystemStatus = async () => {
    const newStatus = systemStatus === 'open' ? 'closed' : 'open';
    const actionText = newStatus === 'open' ? 'เปิดรับคำขอ (เปิดทุกกลุ่มงาน)' : 'ปิดรับคำขอ (ปิดทุกกลุ่มงาน)';
    if (!confirm(`ต้องการเปลี่ยนสถานะระบบเป็น "${actionText}" ใช่หรือไม่?\n\n* การกระทำนี้จะปรับสถานะในหน้าตั้งค่าสิทธิ์ของทุกกลุ่มงานเป็น "เปิด" หรือ "ปิด" รวดเดียวทั้งหมด`)) return;
    
    await fetch(`/api/admin/settings/system_status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    setSystemStatus(newStatus);
    fetchDepartments();
  };

  const fetchDepartments = async () => {
    const res = await fetch(`/api/activities`);
    const data = await res.json();
    setActivitiesList(data);
    const depts = [...new Set(data.map(d => d.department))];
    setDepartments(depts);

    const lockRes = await fetch(`/api/departments/locks`);
    const lockData = await lockRes.json();
    setDepartmentLocks(lockData);
  };

  const fetchOrders = async () => {
    const res = await fetch(`/api/requests?role=admin&department=${selectedDept}`);
    const data = await res.json();
    setOrders(data.filter(d => d.tab_category === considerTab));
  };

  const fetchHistory = async () => {
    const res = await fetch(`/api/admin/history`);
    const data = await res.json();
    setHistory(data);
  };

  const handleUpdate = async (id, qty_approved, status) => {
    await fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty_approved, status, admin_name: user.name })
    });
    fetchOrders();
    fetchHistory();
  };

  const handleDepartmentLockUpdate = async (department, is_unlocked) => {
    await fetch(`/api/admin/departments/lock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department, is_unlocked })
    });
    fetchDepartments();
  };

  const exportExcel = () => {
    window.location.href = `/api/export?department=ALL`;
  };

  const getSummary = () => {
    let t2569 = 0;
    let t2570 = 0;
    orders.forEach(o => {
      const activeQty = o.status === 'รอพิจารณา' ? o.qty_requested : o.qty_approved;
      if (o.term === '2/2569') t2569 += activeQty * o.price;
      if (o.term === '1/2570') t2570 += activeQty * o.price;
    });
    return { t2569, t2570, total: t2569 + t2570 };
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>แดชบอร์ดสำหรับผู้ดูแลระบบ</h2>
        <div>
          <button 
            className="btn" 
            style={{ marginRight: '8px', background: systemStatus === 'open' ? '#16a34a' : '#dc2626', color: 'white', border: 'none' }}
            onClick={toggleSystemStatus}
          >
            สถานะระบบ: {systemStatus === 'open' ? '🟢 เปิดรับคำขอ' : '🔴 ปิดรับคำขอ'}
          </button>
          <button className="btn btn-outline" onClick={() => setShowHistory(true)} style={{ marginRight: '8px' }}>
            ดูประวัติการแก้ไข
          </button>
          <button className="btn btn-primary" onClick={exportExcel}>นำออกไฟล์ Excel (ทั้งหมด)</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          Dash Board
        </button>
        <button className={`tab ${activeTab === 'consideration' ? 'active' : ''}`} onClick={() => setActiveTab('consideration')}>
          พิจารณางบประมาณ
        </button>
        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          ตั้งค่าสิทธิ์การแก้ไข
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="card">
          <div className="form-group" style={{ maxWidth: '400px', marginBottom: '24px' }}>
            <label className="form-label">กรองประเภทเงิน</label>
            <select className="form-control" value={budgetCategory} onChange={e => setBudgetCategory(e.target.value)}>
              <option value="1">1. เงินอุดหนุน (ค่าจัดการเรียนการสอน)</option>
              <option value="2">2. เงินกิจกรรมพัฒนาคุณภาพผู้เรียน</option>
              <option value="3">3. เงินรายได้สถานศึกษา</option>
            </select>
          </div>

          <table className="table">
            <thead>
              {budgetCategory === '1' ? (
                <tr>
                  <th>กลุ่มงาน/กลุ่มสาระ</th>
                  <th>กิจกรรม</th>
                  <th>วัสดุสำนักงาน</th>
                  <th>เทคโนโลยี</th>
                </tr>
              ) : (
                <tr>
                  <th>กิจกรรม</th>
                  <th>ยอดเงินรวมที่ขอ</th>
                </tr>
              )}
            </thead>
            <tbody>
              {dashboardData.map((d, i) => (
                <tr key={i}>
                  {budgetCategory === '1' ? (
                    <>
                      <td>{d.department}</td>
                      <td>{d.activity_total?.toLocaleString() || 0}</td>
                      <td>{d.office_total?.toLocaleString() || 0}</td>
                      <td>{d.tech_total?.toLocaleString() || 0}</td>
                    </>
                  ) : (
                    <>
                      <td>{d.activity_name}</td>
                      <td>{d.total?.toLocaleString() || 0}</td>
                    </>
                  )}
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold', background: 'var(--bg-color)' }}>
                <td>รวมทั้งสิ้น</td>
                {budgetCategory === '1' ? (
                  <>
                    <td>{dashboardData.reduce((sum, d) => sum + (d.activity_total || 0), 0).toLocaleString()}</td>
                    <td>{dashboardData.reduce((sum, d) => sum + (d.office_total || 0), 0).toLocaleString()}</td>
                    <td>{dashboardData.reduce((sum, d) => sum + (d.tech_total || 0), 0).toLocaleString()}</td>
                  </>
                ) : (
                  <td>{dashboardData.reduce((sum, d) => sum + (d.total || 0), 0).toLocaleString()}</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'consideration' && (
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">เลือกกลุ่มงาน/กลุ่มสาระ</label>
                <select className="form-control" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                  <option value="">-- เลือกกลุ่มงาน --</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">เลือกหมวดหมู่</label>
                <select className="form-control" value={considerTab} onChange={e => setConsiderTab(e.target.value)}>
                  <option value="Activities">กิจกรรม</option>
                  <option value="Office Supplies">วัสดุสำนักงาน</option>
                  <option value="Technology">เทคโนโลยี</option>
                </select>
              </div>
            </div>

            {selectedDept && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>สรุปยอดเงินสุทธิ ({considerTab})</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#1d4ed8', marginBottom: '4px' }}>เทอม 2/2569</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3a8a' }}>{getSummary().t2569.toLocaleString()} บาท</div>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#15803d', marginBottom: '4px' }}>เทอม 1/2570</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#14532d' }}>{getSummary().t2570.toLocaleString()} บาท</div>
                  </div>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#b45309', marginBottom: '4px' }}>รวมทั้งสิ้น</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#78350f' }}>{getSummary().total.toLocaleString()} บาท</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if(confirm('ต้องการอนุมัติรายการที่รอพิจารณาทั้งหมดในหมวดหมู่นี้ใช่หรือไม่?')) {
                    orders.filter(o => o.status === 'รอพิจารณา').forEach(o => {
                      handleUpdate(o.id, o.qty_requested, 'อนุมัติ');
                    });
                  }
                }}
                disabled={!orders.some(o => o.status === 'รอพิจารณา')}
              >
                อนุมัติรายการที่รอพิจารณาทั้งหมด
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>ภาคเรียน</th>
                  <th>กิจกรรม</th>
                  <th>รายการ</th>
                  <th>ราคา/หน่วย</th>
                  <th>จำนวนที่ขอ</th>
                  <th>จำนวนอนุมัติ</th>
                  <th>ยอดรวม</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center' }}>ไม่พบรายการ</td></tr>
                )}
                {orders.map(o => {
                  const isRejected = o.status === 'ไม่อนุมัติ';
                  const isEdited = o.status === 'แก้ไข';
                  return (
                    <tr key={o.id} style={{ 
                      background: isEdited ? '#fffbeb' : 'inherit',
                      opacity: isRejected ? 0.6 : 1,
                      textDecoration: isRejected ? 'line-through' : 'none',
                      color: isRejected ? 'red' : 'inherit'
                    }}>
                      <td>{o.term}</td>
                      <td>{o.activity_id !== '-' ? `[${o.activity_id}]` : '-'}</td>
                      <td>{o.item_name}</td>
                      <td>{o.price.toLocaleString()}</td>
                      <td>{o.qty_requested}</td>
                      <td>
                        <input 
                          type="number" 
                          className="form-control" 
                          style={{ width: '80px', padding: '4px 8px' }}
                          defaultValue={o.qty_approved === 0 && o.status === 'รอพิจารณา' ? o.qty_requested : o.qty_approved}
                          disabled={isRejected}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            const currentVal = o.qty_approved === 0 && o.status === 'รอพิจารณา' ? o.qty_requested : o.qty_approved;
                            if (val !== currentVal) {
                              handleUpdate(o.id, val, val !== o.qty_requested ? 'แก้ไข' : 'อนุมัติ');
                            }
                          }}
                        />
                      </td>
                      <td>{((o.status === 'รอพิจารณา' ? o.qty_requested : o.qty_approved) * o.price).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${isRejected ? 'badge-rejected' : isEdited ? 'badge-edited' : 'badge-approved'}`} style={{
                          background: isRejected ? '#fee2e2' : isEdited ? '#fef3c7' : '#dcfce7',
                          color: isRejected ? '#991b1b' : isEdited ? '#92400e' : '#166534',
                          padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem'
                        }}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {o.status === 'รอพิจารณา' && (
                            <button className="btn btn-outline" style={{ color: 'green', borderColor: 'green', padding: '4px 8px' }} onClick={() => handleUpdate(o.id, o.qty_requested, 'อนุมัติ')}>
                              อนุมัติ
                            </button>
                          )}
                          {!isRejected ? (
                            <button className="btn btn-outline" style={{ color: 'red', borderColor: 'red', padding: '4px 8px' }} onClick={() => handleUpdate(o.id, 0, 'ไม่อนุมัติ')}>
                              ไม่อนุมัติ
                            </button>
                          ) : (
                            <button className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => handleUpdate(o.id, o.qty_requested, 'อนุมัติ')}>
                              ยกเลิกไม่อนุมัติ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h3>ตั้งค่าสิทธิ์การแก้ไข (Unlock Departments)</h3>
            <p style={{ color: 'var(--text-muted)' }}>เปิดสิทธิ์ให้กลุ่มงานสามารถเข้าไปแก้ไขรายการของตนเองได้ (อนุญาตให้จัดการได้ทุกหมวดกิจกรรม วัสดุสำนักงาน และเทคโนโลยี)</p>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>กลุ่มงาน/กลุ่มสาระ</th>
                <th>สถานะการแก้ไข (User)</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d, index) => {
                const lock = departmentLocks.find(l => l.department === d);
                const isUnlocked = lock ? lock.is_unlocked === 1 : (systemStatus === 'open');
                return (
                  <tr key={d}>
                    <td>{index + 1}</td>
                    <td>{d}</td>
                    <td>
                      <select className="form-control" value={isUnlocked ? "1" : "0"} onChange={e => handleDepartmentLockUpdate(d, parseInt(e.target.value))}>
                        <option value="0">ปิด (ไม่อนุญาต)</option>
                        <option value="1">เปิด (User แก้ไขได้)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>ประวัติการแก้ไข</h3>
              <div className="form-group" style={{ margin: 0 }}>
                <select className="form-control" value={historyFilterDept} onChange={e => setHistoryFilterDept(e.target.value)}>
                  <option value="">-- ทุกกลุ่มงาน --</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>วัน-เวลา</th>
                    <th>กลุ่มงาน</th>
                    <th>กิจกรรม</th>
                    <th>ผู้แก้ไข</th>
                    <th>รายการ</th>
                    <th>เดิม</th>
                    <th>ใหม่</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {history.filter(h => !historyFilterDept || h.department === historyFilterDept).map(h => (
                    <tr key={h.id}>
                      <td>{new Date(h.created_at).toLocaleString('th-TH')}</td>
                      <td>{h.department || '-'}</td>
                      <td>{h.activity_id !== '-' ? `[${h.activity_id}]` : '-'}</td>
                      <td>{h.admin_name}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.item_name}>{h.item_name}</td>
                      <td>{h.old_qty}</td>
                      <td>{h.new_qty}</td>
                      <td>{h.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={() => setShowHistory(false)}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
