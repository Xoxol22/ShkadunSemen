import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

export function AppLayout() {
  const location = useLocation();

  const documents = useAppSelector((state) => state.documents.items);

  const isDocumentPage = location.pathname.startsWith('/documents/');
  const documentId = isDocumentPage
    ? location.pathname.split('/')[2]
    : undefined;

  const currentDocument = documents.find(
    (document) => document.id === documentId,
  );

  return (
    <div className="appLayout">
      <header className="appHeader">
        <div className="breadcrumbs">
          <NavLink to="/dashboard">Мои документы</NavLink>

          {isDocumentPage && (
            <>
              <span className="breadcrumbsSeparator">→</span>
              <span className="breadcrumbsCurrent">
                {currentDocument?.title ?? 'Документ'}
              </span>
            </>
          )}
        </div>

        <nav className="topNav">
          <NavLink to="/profile">Профиль</NavLink>
        </nav>
      </header>

      <main className="appContent">
        <Outlet />
      </main>
    </div>
  );
}