import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

export default function RoleRoute({ allowedRoles }) {
  const { user } = useSelector((state) => state.auth);
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}