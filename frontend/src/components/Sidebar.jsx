import { useAuth } from '../context/AuthContext';
import { Home, Edit3, LogOut, Users, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          $
        </div>
        Menu
      </div>

      <nav className="sidebar-nav">
        {user.role === 'admin' ? (
          <>
            <Link to="/" className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}>
              <Home size={20} />
              แดชบอร์ด (Admin)
            </Link>
            <Link to="/admin/users" className={`sidebar-link ${location.pathname === '/admin/users' ? 'active' : ''}`}>
              <Users size={20} />
              จัดการผู้ใช้
            </Link>
            <Link to="/admin/products" className={`sidebar-link ${location.pathname === '/admin/products' ? 'active' : ''}`}>
              <Package size={20} />
              จัดการรายการสินค้า
            </Link>
            <Link to="/user" className={`sidebar-link ${location.pathname === '/user' ? 'active' : ''}`}>
              <Edit3 size={20} />
              บันทึกรายการ
            </Link>
          </>
        ) : (
          <Link to="/" className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}>
            <Edit3 size={20} />
            บันทึกรายการ
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
