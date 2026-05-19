import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

export function ProtectedRoute() {
	const location = useLocation();

	const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
	const isInitialized = useAppSelector((state) => state.auth.isInitialized);

	if (!isInitialized) {
		return <div className="page">Проверка сессии...</div>;
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <Outlet />;
}
