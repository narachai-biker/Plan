import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar animate-fade-in" style={{ 
      display: 'flex', 
      justifyContent: 'flex-end', /* Pushes content to the right since left logo is removed */
      alignItems: 'center',
      background: 'linear-gradient(135deg, #4f46e5, #9333ea, #ec4899)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      padding: '16px 32px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%'
    }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '1.1rem' }}>
          สวัสดี {user.name}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
          กลุ่มสาระ/กลุ่มงาน: {user.department}
        </div>
      </div>
    </nav>
  );
}
