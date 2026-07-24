import { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut } from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import NotificationBell from '../features/notifications/NotificationBell';
import Sidebar from './Sidebar';
import ConfirmDialog from './ConfirmDialog';

export default function Layout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isClient = user?.role === 'CLIENT';
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <header className="top-header">
          <div className="top-header-left">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 className="app-title" style={{ cursor: 'pointer' }}>
                Security <span style={{ color: '#991b1b' }}>Workforce</span> Manager
              </h2>
            </Link>
          </div>

          <div className="top-header-right">
            {!isClient && <NotificationBell />}

            <div className="top-header-user">
              <span>{user?.name}</span>
              <span className="role-badge">{user?.role}</span>
            </div>

            <button className="logout-btn" onClick={() => setConfirmOpen(true)}>
              <LogOut
                size={13}
                style={{ verticalAlign: 'middle', marginRight: 5, color: 'red' }}
              />
              <span>Logout</span>
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out?"
        message="You'll need to sign in again to access your dashboard."
        onConfirm={confirmLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}