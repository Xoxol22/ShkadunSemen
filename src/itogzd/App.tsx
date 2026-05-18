import { Navigate, Route, Routes } from 'react-router-dom';
import { DocumentsPage } from './pages/DocumentsPage';
import { SpreadsheetPage } from './pages/SpreadsheetPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export default function App() {
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
