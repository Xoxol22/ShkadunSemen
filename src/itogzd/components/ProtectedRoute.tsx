import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';


const isMockAuthenticated = true;

export function ProtectedRoute() {
  const location = useLocation();

  const isAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated,
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}