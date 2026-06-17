import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

function AdminIncomeCalculator() {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('incomesettings').select('*').order('id', { ascending: true });
    if (error) {
      console.error('Error fetching incomes:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } else {
      setIncomes(data || []);
    }
    setLoading(false);
  };

  const handleInputChange = (id, field, value) => {
    const numValue = parseFloat(value) || 0;
    setIncomes(prev => prev.map(inc => inc.id === id ? { ...inc, [field]: numValue } : inc));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const inc of incomes) {
        await supabase
          .from('incomesettings')
          .update({
            students_term1: inc.students_term1,
            amount_term1: inc.amount_term1,
            students_term2: inc.students_term2,
            amount_term2: inc.amount_term2
          })
          .eq('id', inc.id);
      }
      alert('บันทึกข้อมูลสำเร็จ!');
    } catch (e) {
      console.error('Error saving:', e);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '20px' }}>กำลังโหลดข้อมูล...</div>;

  const totalTerm1 = incomes.reduce((sum, inc) => sum + (inc.students_term1 * inc.amount_term1), 0);
  const totalTerm2 = incomes.reduce((sum, inc) => sum + (inc.students_term2 * inc.amount_term2), 0);
  const grandTotal = totalTerm1 + totalTerm2;

  // Group by category for display
  const grouped = incomes.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>คำนวณเงินรายได้สถานศึกษา</h2>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#1d4ed8', marginBottom: '4px' }}>รวมยอดเทอม 1</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a' }}>{totalTerm1.toLocaleString()} บาท</div>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#1d4ed8', marginBottom: '4px' }}>รวมยอดเทอม 2</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a' }}>{totalTerm2.toLocaleString()} บาท</div>
        </div>
        <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#1e40af', marginBottom: '4px' }}>ยอดรวมทั้งสิ้น (เทอม 1 + 2)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a' }}>{grandTotal.toLocaleString()} บาท</div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th rowSpan="2" style={{ verticalAlign: 'middle' }}>หมวดหมู่เงิน / วัตถุประสงค์</th>
              <th colSpan="3" style={{ textAlign: 'center', borderBottom: '1px solid #eee' }}>เทอม 1</th>
              <th colSpan="3" style={{ textAlign: 'center', borderBottom: '1px solid #eee', borderLeft: '2px solid #eee' }}>เทอม 2</th>
              <th rowSpan="2" style={{ verticalAlign: 'middle', textAlign: 'right', borderLeft: '2px solid #eee' }}>รวมทั้งสิ้น</th>
            </tr>
            <tr>
              <th style={{ textAlign: 'right' }}>จน.นักเรียน</th>
              <th style={{ textAlign: 'right' }}>บาท/หัว</th>
              <th style={{ textAlign: 'right' }}>รวม (บาท)</th>
              <th style={{ textAlign: 'right', borderLeft: '2px solid #eee' }}>จน.นักเรียน</th>
              <th style={{ textAlign: 'right' }}>บาท/หัว</th>
              <th style={{ textAlign: 'right' }}>รวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(grouped).map((category, catIndex) => (
              <React.Fragment key={category}>
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <td colSpan="8">{category}</td>
                </tr>
                {grouped[category].map((inc, i) => {
                  const t1 = inc.students_term1 * inc.amount_term1;
                  const t2 = inc.students_term2 * inc.amount_term2;
                  const rowTotal = t1 + t2;
                  return (
                    <tr key={inc.id}>
                      <td style={{ paddingLeft: '32px' }}>{inc.sub_category || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" style={{ width: '80px', textAlign: 'right', padding: '4px' }} value={inc.students_term1 || ''} onChange={e => handleInputChange(inc.id, 'students_term1', e.target.value)} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" style={{ width: '80px', textAlign: 'right', padding: '4px' }} value={inc.amount_term1 || ''} onChange={e => handleInputChange(inc.id, 'amount_term1', e.target.value)} />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#047857' }}>{t1.toLocaleString()}</td>
                      
                      <td style={{ textAlign: 'right', borderLeft: '2px solid #eee' }}>
                        <input type="number" style={{ width: '80px', textAlign: 'right', padding: '4px' }} value={inc.students_term2 || ''} onChange={e => handleInputChange(inc.id, 'students_term2', e.target.value)} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" style={{ width: '80px', textAlign: 'right', padding: '4px' }} value={inc.amount_term2 || ''} onChange={e => handleInputChange(inc.id, 'amount_term2', e.target.value)} />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#047857' }}>{t2.toLocaleString()}</td>
                      
                      <td style={{ textAlign: 'right', borderLeft: '2px solid #eee', fontWeight: 'bold', fontSize: '1.1rem' }}>{rowTotal.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminIncomeCalculator;
