import React, { useState, useEffect } from 'react';

function AdminUserManagement() {
  const LEARNING_AREAS = [
    'ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์', 'เทคโนโลยี', 'สังคมศึกษา',
    'สุขศึกษา', 'ศิลปะ', 'ภาษาต่างประเทศ', 'การงานอาชีพ', 'แนะแนว',
    'ห้องสมุด', 'กิจกรรมพัฒนาผู้เรียน', 'ห้องเรียนพิเศษ'
  ];

  const TASK_GROUPS = [
    'กลุ่มบริหารวิชาการ',
    'บริหารงบประมาณและแผนงาน(งานการเงิน)',
    'บริหารงบประมาณและแผนงาน(งานพัสดุ)',
    'บริหารงบประมาณและแผนงาน(งานแผนงาน)',
    'บริหารงบประมาณและแผนงาน(งานยานพาหนะ)',
    'บริหารงบประมาณและแผนงาน(งานโรงเรียนธนาคาร)',
    'บริหารอำนวยการและบุคคล',
    'บริหารกิจการนักเรียน',
    'บริหารทั่วไป'
  ];

  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, username: '', password: '', name: '', role: 'user', learningArea: '', taskGroup: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(`/api/admin/users`);
    const data = await res.json();
    setUsers(data);
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      const depts = user.department ? user.department.split(',').map(d => d.trim()) : [];
      let learningArea = '';
      let taskGroup = '';
      depts.forEach(d => {
        if (LEARNING_AREAS.includes(d)) learningArea = d;
        else if (TASK_GROUPS.includes(d)) taskGroup = d;
      });
      setFormData({ ...user, learningArea, taskGroup });
    } else {
      setFormData({ id: null, username: '', password: '', name: '', role: 'user', learningArea: '', taskGroup: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalDept = [formData.learningArea, formData.taskGroup].filter(Boolean).join(', ');
    const payload = { ...formData, department: finalDept };

    const url = formData.id 
      ? `/api/admin/users/${formData.id}`
      : `/api/admin/users`;
    
    const method = formData.id ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setShowModal(false);
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!confirm('ยืนยันการลบผู้ใช้งานรายนี้?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3>จัดการผู้ใช้งานระบบ</h3>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ เพิ่มผู้ใช้ใหม่</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>ชื่อผู้ใช้</th>
              <th>กลุ่มงาน/กลุ่มสาระ</th>
              <th>สิทธิ์</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.name}</td>
                <td>{u.department}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '999px', 
                    fontSize: '0.8rem',
                    background: u.role === 'admin' ? '#fee2e2' : '#f1f5f9',
                    color: u.role === 'admin' ? '#ef4444' : '#64748b'
                  }}>
                    {u.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '999px', 
                    fontSize: '0.8rem',
                    background: '#dcfce7',
                    color: '#16a34a'
                  }}>
                    {u.status || 'active'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '4px 8px', marginRight: '8px', fontSize: '0.85rem' }} onClick={() => handleOpenModal(u)}>แก้ไข</button>
                  <button className="btn" style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', fontSize: '0.85rem' }} onClick={() => handleDelete(u.id)}>ลบ</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>ไม่พบข้อมูลผู้ใช้งาน</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h3>{formData.id ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้งานใหม่'}</h3>
            <form onSubmit={handleSave} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input required className="form-control" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input required className="form-control" type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">ชื่อ-นามสกุล</label>
                <input required className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">กลุ่มสาระ</label>
                  <select className="form-control" value={formData.learningArea} onChange={e => setFormData({...formData, learningArea: e.target.value})}>
                    <option value="">-- ไม่ระบุ --</option>
                    {LEARNING_AREAS.map(la => <option key={la} value={la}>{la}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">กลุ่มงาน</label>
                  <select className="form-control" value={formData.taskGroup} onChange={e => setFormData({...formData, taskGroup: e.target.value})}>
                    <option value="">-- ไม่ระบุ --</option>
                    {TASK_GROUPS.map(tg => <option key={tg} value={tg}>{tg}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">สิทธิ์การใช้งาน (Role)</label>
                <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="user">ผู้ใช้งานทั่วไป (User)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUserManagement;
