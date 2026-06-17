import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminProductManagement() {
  const [products, setProducts] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic categories
  const dynamicCategories = [...new Set(products.map(p => p.category))].filter(Boolean).sort();
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Single Form
  const [formData, setFormData] = useState({ id: null, category: '', item_name: '', unit: '', price: '', budget_type: 'วัสดุ' });
  
  // Bulk Form
  const [bulkText, setBulkText] = useState('');
  const [parsedBulkData, setParsedBulkData] = useState([]);
  
  // Custom Category State
  const [isNewCategory, setIsNewCategory] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('productcatalog').select('*');
    if (data) setProducts(data);
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setFormData(product);
      setIsNewCategory(false);
    } else {
      setFormData({ id: null, category: dynamicCategories[0] || '', item_name: '', unit: '', price: '', budget_type: 'วัสดุ' });
      setIsNewCategory(false);
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      category: formData.category,
      item_name: formData.item_name,
      unit: formData.unit,
      price: parseFloat(formData.price) || 0,
      budget_type: formData.budget_type
    };

    if (formData.id) {
      await supabase.from('productcatalog').update(payload).eq('id', formData.id);
    } else {
      await supabase.from('productcatalog').insert([payload]);
    }

    setShowModal(false);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm('ยืนยันการลบสินค้านี้?')) return;
    await supabase.from('productcatalog').delete().eq('id', id);
    fetchProducts();
  };

  // Bulk parser (Expects tab-separated columns: Category, Item Name, Unit, Price)
  const handleBulkParse = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.trim().split('\n');
    const parsed = lines.map(line => {
      const cols = line.split('\t').map(c => c.trim());
      // Try to parse standard 5 columns: Category, ItemName, Unit, Price, BudgetType
      let cat = cols[0] || '';
      let name = cols[1] || '';
      let unit = cols[2] || '';
      let price = parseFloat(cols[3]) || 0;
      let budget_type = cols[4] || 'วัสดุ';

      return { category: cat, item_name: name, unit, price, budget_type };
    });
    setParsedBulkData(parsed);
  };

  const handleBulkSave = async () => {
    if (parsedBulkData.length === 0) return;
    await supabase.from('productcatalog').insert(parsedBulkData);
    setShowBulkModal(false);
    setBulkText('');
    setParsedBulkData([]);
    fetchProducts();
  };

  const visibleProducts = products.filter(p => {
    if (filterCategory && p.category !== filterCategory) return false;
    if (searchQuery && !p.item_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="card animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h3>จัดการรายการสินค้า ({products.length} รายการ)</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" style={{ background: '#10b981', color: 'white', border: 'none' }} onClick={() => setShowBulkModal(true)}>
            + นำเข้าจาก Excel
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + เพิ่มสินค้าใหม่ 1 รายการ
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="🔍 ค้นหาสินค้า..." 
          className="form-control" 
          style={{ maxWidth: '300px' }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select 
          className="form-control" 
          style={{ maxWidth: '300px' }}
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="">-- ดูทุกหมวดหมู่ --</option>
          {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>ID</th>
              <th style={{ width: '250px' }}>หมวดหมู่</th>
              <th>ชื่อสินค้า</th>
              <th style={{ width: '100px' }}>หน่วยนับ</th>
              <th style={{ width: '100px' }}>ประเภทงบ</th>
              <th style={{ width: '100px', textAlign: 'right' }}>ราคา</th>
              <th style={{ width: '150px', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.category}</td>
                <td style={{ fontWeight: 'bold' }}>{p.item_name}</td>
                <td>{p.unit}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '999px', 
                    fontSize: '0.8rem',
                    background: p.budget_type === 'ครุภัณฑ์' ? '#ffedd5' 
                              : p.budget_type === 'ค่าตอบแทน' ? '#dcfce7'
                              : p.budget_type === 'ค่าใช้สอย' ? '#f3e8ff'
                              : '#e0f2fe',
                    color: p.budget_type === 'ครุภัณฑ์' ? '#ea580c' 
                         : p.budget_type === 'ค่าตอบแทน' ? '#16a34a'
                         : p.budget_type === 'ค่าใช้สอย' ? '#9333ea'
                         : '#0284c7'
                  }}>
                    {p.budget_type || 'วัสดุ'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', color: '#0f172a' }}>฿{p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn btn-outline" style={{ padding: '4px 8px', marginRight: '8px', fontSize: '0.85rem' }} onClick={() => handleOpenModal(p)}>แก้ไข</button>
                  <button className="btn" style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', fontSize: '0.85rem' }} onClick={() => handleDelete(p.id)}>ลบ</button>
                </td>
              </tr>
            ))}
            {visibleProducts.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  ไม่พบรายการสินค้าที่ค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Single Item Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h3>{formData.id ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
            <form onSubmit={handleSave} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">หมวดหมู่</label>
                {!isNewCategory ? (
                  <select 
                    className="form-control" 
                    value={formData.category} 
                    onChange={e => {
                      if (e.target.value === 'NEW_CATEGORY') {
                        setIsNewCategory(true);
                        setFormData({...formData, category: ''});
                      } else {
                        setFormData({...formData, category: e.target.value});
                      }
                    }}
                  >
                    {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="NEW_CATEGORY">+ เพิ่มหมวดหมู่ใหม่...</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      required 
                      className="form-control" 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ (เช่น หมวดบอร์ดเกม)..."
                      autoFocus
                    />
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      onClick={() => {
                        setIsNewCategory(false);
                        setFormData({...formData, category: dynamicCategories[0] || ''});
                      }}
                    >
                      ยกเลิก
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">ชื่อสินค้า</label>
                <input required className="form-control" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">ประเภทงบ</label>
                <select className="form-control" value={formData.budget_type} onChange={e => setFormData({...formData, budget_type: e.target.value})}>
                  <option value="วัสดุ">วัสดุ</option>
                  <option value="ค่าตอบแทน">ค่าตอบแทน</option>
                  <option value="ค่าใช้สอย">ค่าใช้สอย</option>
                  <option value="ครุภัณฑ์">ครุภัณฑ์</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">หน่วยนับ (เช่น กล่อง, โหล, อัน)</label>
                  <input required className="form-control" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">ราคาต่อหน่วย (บาท)</label>
                  <input required type="number" step="0.01" className="form-control" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>นำเข้าสินค้าจาก Excel</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
              สามารถ Copy ข้อมูลจาก Excel วางลงในช่องด้านล่างได้เลย โดยเรียงลำดับคอลัมน์ดังนี้:<br/>
              <strong>[หมวดหมู่] | [ชื่อสินค้า] | [หน่วยนับ] | [ราคา] | [ประเภทงบ]</strong>
            </p>
            
            <textarea 
              className="form-control" 
              rows="6" 
              placeholder="วางข้อมูลจาก Excel ลงที่นี่..."
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              style={{ fontFamily: 'monospace', whiteSpace: 'pre', overflowWrap: 'normal', overflowX: 'auto' }}
            ></textarea>
            
            <button className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={handleBulkParse}>
              อ่านข้อมูล
            </button>

            {parsedBulkData.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h4>ตัวอย่างข้อมูลที่จะนำเข้า ({parsedBulkData.length} รายการ)</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '8px' }}>
                  <table className="table" style={{ margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
                      <tr>
                        <th>หมวดหมู่</th>
                        <th>ชื่อสินค้า</th>
                        <th>หน่วย</th>
                        <th>ราคา</th>
                        <th>ประเภทงบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedBulkData.map((p, i) => (
                        <tr key={i}>
                          <td>{p.category}</td>
                          <td>{p.item_name}</td>
                          <td>{p.unit}</td>
                          <td>{p.price}</td>
                          <td>{p.budget_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <button type="button" className="btn btn-outline" onClick={() => { setShowBulkModal(false); setBulkText(''); setParsedBulkData([]); }}>ยกเลิก</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ background: parsedBulkData.length === 0 ? '#94a3b8' : '#10b981', border: 'none' }}
                disabled={parsedBulkData.length === 0}
                onClick={handleBulkSave}
              >
                บันทึกเข้าสู่ระบบ ({parsedBulkData.length} รายการ)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
