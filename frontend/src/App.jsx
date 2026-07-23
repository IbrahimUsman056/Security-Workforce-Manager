import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import RegisterOrgPage from './features/auth/RegisterOrgPage';
import JoinOrgPage from './features/auth/JoinOrgPage';
import ProtectedRoute from './features/auth/ProtectedRoute';
import RoleRoute from './features/auth/RoleRoute';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import SitesPage from './features/sites/SitesPage';
import ShiftsPage from './features/shifts/ShiftsPage';
import TemplatesPage from './features/shiftTemplates/TemplatesPage';
import MyShiftsPage from './features/assignments/MyShiftsPage';
import IncidentsPage from './features/incidents/IncidentsPage';
import SwapsPage from './features/swaps/SwapsPage';
import ReportsPage from './features/reports/ReportsPage';
import AuditLogsPage from './features/audit/AuditLogsPage';
import ProfilePage from './features/profile/ProfilePage';
import PayrollAdjustmentsPage from './features/payroll/PayrollAdjustmentsPage';
import InvoicesPage from './features/payroll/InvoicesPage';
import MyPayslipPage from './features/payroll/MyPayslipPage';
import AdminDocumentsPage from './features/documents/AdminDocumentsPage';
import ManageClientAccessPage from './features/client/ManageClientAccessPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-org" element={<RegisterOrgPage />} />
        <Route path="/join" element={<JoinOrgPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/swaps" element={<SwapsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path="/sites" element={<SitesPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/payroll-adjustments" element={<PayrollAdjustmentsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/staff-documents" element={<AdminDocumentsPage />} />
              <Route path="/manage-client-access" element={<ManageClientAccessPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['ADMIN', 'SUPERVISOR']} />}>
              <Route path="/shifts" element={<ShiftsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['STAFF']} />}>
              <Route path="/my-shifts" element={<MyShiftsPage />} />
              <Route path="/my-payslip" element={<MyPayslipPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}