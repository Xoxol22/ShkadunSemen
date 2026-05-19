import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DocumentsPage } from './pages/DocumentsPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { SpreadsheetPage } from './pages/SpreadsheetPage';
import { useAppDispatch } from './store/hooks';
import { restoreSession } from './store/slices/authSlice';

export default function App() {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(restoreSession());
	}, [dispatch]);

	return (
		<Routes>
			<Route path="/" element={<Navigate to="/dashboard" replace />} />

			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />

			<Route element={<ProtectedRoute />}>
				<Route element={<AppLayout />}>
					<Route path="/dashboard" element={<DocumentsPage />} />
					<Route path="/documents/:documentId" element={<SpreadsheetPage />} />
					<Route path="/profile" element={<ProfilePage />} />
				</Route>
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}
