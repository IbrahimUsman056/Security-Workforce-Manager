import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Building2, CalendarClock, LayoutTemplate, ClipboardList,
  AlertTriangle, ArrowLeftRight, UserCircle, BarChart3, ScrollText,
  Wallet, Receipt, Users, Files, LogOut,
} from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import ConfirmDialog from './ConfirmDialog';

export default function Sidebar() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isSupervisor = user?.role === 'SUPERVISOR';
  const isStaff = user?.role === 'STAFF';
  const isClient = user?.role === 'CLIENT';

  const linkClass = ({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`;

  const confirmLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Logo" className="sidebar-brand-logo" />
        <span className="sidebar-label sidebar-brand-title">SWM</span>
      </div>

      <div className="sidebar-tagline">
        <span className="sidebar-label">Operations Control Panel</span>
      </div>

      <nav className="sidebar-links">
        <NavLink to="/" end className={linkClass}><LayoutDashboard size={19} /><span className="sidebar-label">Dashboard</span></NavLink>

        {isAdmin && <NavLink to="/sites" className={linkClass}><Building2 size={19} /><span className="sidebar-label">Sites</span></NavLink>}
        {(isAdmin || isSupervisor) && <NavLink to="/shifts" className={linkClass}><CalendarClock size={19} /><span className="sidebar-label">Shifts</span></NavLink>}
        {(isAdmin || isSupervisor) && <NavLink to="/templates" className={linkClass}><LayoutTemplate size={19} /><span className="sidebar-label">Templates</span></NavLink>}

        {isStaff && <NavLink to="/my-shifts" className={linkClass}><ClipboardList size={19} /><span className="sidebar-label">My Shifts</span></NavLink>}
        {isStaff && <NavLink to="/my-payslip" className={linkClass}><Wallet size={19} /><span className="sidebar-label">My Payslip</span></NavLink>}

        {!isClient && <NavLink to="/incidents" className={linkClass}><AlertTriangle size={19} /><span className="sidebar-label">Incidents</span></NavLink>}
        {!isClient && <NavLink to="/swaps" className={linkClass}><ArrowLeftRight size={19} /><span className="sidebar-label">Swaps</span></NavLink>}
        {!isClient && <NavLink to="/profile" className={linkClass}><UserCircle size={19} /><span className="sidebar-label">My Profile</span></NavLink>}

        {(isAdmin || isSupervisor) && <NavLink to="/reports" className={linkClass}><BarChart3 size={19} /><span className="sidebar-label">Reports</span></NavLink>}

        {isAdmin && <NavLink to="/audit-logs" className={linkClass}><ScrollText size={19} /><span className="sidebar-label">Audit Logs</span></NavLink>}
        {isAdmin && <NavLink to="/payroll-adjustments" className={linkClass}><Wallet size={19} /><span className="sidebar-label">Adjustments</span></NavLink>}
        {isAdmin && <NavLink to="/invoices" className={linkClass}><Receipt size={19} /><span className="sidebar-label">Invoices</span></NavLink>}
        {isAdmin && <NavLink to="/staff-documents" className={linkClass}><Files size={19} /><span className="sidebar-label">Staff Documents</span></NavLink>}
        {isAdmin && <NavLink to="/manage-client-access" className={linkClass}><Users size={19} /><span className="sidebar-label">Client Access</span></NavLink>}
      </nav>

      <button className="sidebar-logout" onClick={() => setConfirmOpen(true)}>
        <LogOut size={19} />
        <span className="sidebar-label">Logout</span>
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out?"
        message="You'll need to sign in again to access your dashboard."
        onConfirm={confirmLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </aside>
  );
}