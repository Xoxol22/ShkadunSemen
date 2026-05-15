import { useAppDispatch, useAppSelector } from './store/hooks';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DocumentsPage } from './pages/DocumentsPage';
import { SpreadsheetPage } from './pages/SpreadsheetPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';

export default function App() {
 const dispatch = useAppDispatch();
const openedDocument = useAppSelector((state) => state.documents.activeDocument);

    return (
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

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

