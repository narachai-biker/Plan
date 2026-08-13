import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AdminUserManagement() {
  const DEPARTMENTS = [
    'กลุ่มบริหารวิชาการ',
    'กลุ่มบริหารงบประมาณและแผนงาน (งานการเงินและบัญชี)',
    'กลุ่มบริหารงบประมาณและแผนงาน (งานแผนงาน)',
    'กลุ่มบริหารงบประมาณและแผนงาน (งานพัสดุ)',
    'กลุ่มบริหารงบประมาณและแผนงาน (งานโรงเรียนธนาคาร)',
    'กลุ่มบริหารอำนวยการและบุคคล (งานสารบรรณ)',
    'กลุ่มบริหารอำนวยการและบุคคล (งานบุคคล)',
    'กลุ่มบริหารอำนวยการและบุคคล (งานควบคุมภายใน)',
    'กลุ่มบริหารทั่วไป (สำนักงาน)',
    'กลุ่มบริหารทั่วไป (งานโสตทัศนูปกรณ์)',
    'กลุ่มบริหารกิจการนักเรียน (สำนักงาน)',
    'กลุ่มบริหารกิจการนักเรียน (สภานักเรียน)',
    'โครงการห้องเรียนวิทยาศาสตร์พลังสิบ',
    'กลุ่มสาระการเรียนรู้ภาษาไทย',
    'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    'งานคอมพิวเตอร์',
    'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนาและวัฒนธรรม',
    'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
    'กลุ่มสาระการเรียนรู้ศิลปะ',
    'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
    'กลุ่มสาระการเรียนรู้การงานอาชีพ',
    'งานกิจกรรมพัฒนาผู้เรียน',
    'งานแนะแนว',
    'งานห้องสมุด'
  ];

  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, username: '', password: '', name: '', role: 'user', department: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('id', { ascending: true });
    if (data) setUsers(data);
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setFormData({ ...user, department: user.department || '' });
    } else {
      setFormData({ id: null, username: '', password: '', name: '', role: 'user', department: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { 
      username: formData.username,
      password: formData.password,
      name: formData.name,
      role: formData.role,
      department: formData.department,
      status: formData.status || 'active'
    };

    if (formData.id) {
      await supabase.from('users').update(payload).eq('id', formData.id);
    } else {
      await supabase.from('users').insert([payload]);
    }

    setShowModal(false);
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!confirm('ยืนยันการลบผู้ใช้งานรายนี้?')) return;
    await supabase.from('users').delete().eq('id', id);
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
              <div className="form-group">
                <label className="form-label">กลุ่มงาน/กลุ่มสาระ</label>
                <select className="form-control" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                  <option value="">-- ไม่ระบุ --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
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
