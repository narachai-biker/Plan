import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminUserManagement from './components/AdminUserManagement';
import AdminProductManagement from './components/AdminProductManagement';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {user && <Navbar />}
        <div style={{ display: 'flex', flex: 1 }}>
          {user && <Sidebar />}
          <main className={user ? 'main-content' : ''} style={{ width: '100%', padding: 0 }}>
            <div style={{ padding: '32px' }}>
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            
              {/* Admin Routes */}
              {user?.role === 'admin' && (
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUserManagement />} />
                  <Route path="/admin/products" element={<AdminProductManagement />} />
                  <Route path="/user" element={<UserDashboard />} />
                </>
              )}

              {/* User Routes */}
              {user?.role !== 'admin' && (
                <>
                  <Route path="/" element={!user ? <Navigate to="/login" /> : <UserDashboard />} />
                </>
              )}

              {/* Catch-all redirect */}
              <Route path="*" element={!user ? <Navigate to="/login" /> : <Navigate to="/" />} />
            </Routes>
          </div>
        </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
