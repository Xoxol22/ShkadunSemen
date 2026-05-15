import { Navigate, Outlet, useLocation } from 'react-router-dom';

const isMockAuthenticated = true;

export function ProtectedRoute() {
  const location = useLocation();

  if (!isMockAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}