import { FormulaBar } from '../features/spreadsheet/FormulaBar';
import { SpreadsheetGrid } from '../features/spreadsheet/SpreadsheetGrid';
import { ContextMenu } from '../features/spreadsheet/ContextMenu';
import { loadCellsFromPreview as loadCellsFromPreviewAction } from '../store/slices/spreadsheetSlice';
import { useEffect, useRef } from 'react';
import { loadSavedDocument } from '../features/documents/mockDocumentsApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSaveStatus, setUnsavedChanges } from '../store/slices/uiSlice';
import {
  loadDocuments,
  saveDocument as saveDocumentThunk,
  setActiveDocument,
} from '../store/slices/documentsSlice';
import { Navigate, useNavigate, useParams } from 'react-router-dom';


export function SpreadsheetPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const documents = useAppSelector((state) => state.documents.items);
  const isLoading = useAppSelector((state) => state.documents.isLoading);

  const cells = useAppSelector((state) => state.spreadsheet.cells);

  const saveStatus = useAppSelector((state) => state.ui.saveStatus);
  const hasUnsavedChanges = useAppSelector((state) => state.ui.hasUnsavedChanges);

  const currentUser = useAppSelector((state) => state.auth.user);
  const userId = currentUser?.id;

  const currentDocument = documents.find(
    (document) => document.id === documentId,
  );
  useEffect(() => {
    if (!currentDocument) return;

    dispatch(
      setActiveDocument({
        id: currentDocument.id,
        title: currentDocument.title,
        preview: currentDocument.preview,
      }),
    );

    return () => {
      dispatch(setActiveDocument(null));
    };
  }, [currentDocument, dispatch]);

  const loadedDocumentKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    dispatch(loadDocuments(userId));
  }, [dispatch, userId]);

  useEffect(() => {
    if (!documentId || !userId || !currentDocument) return;

    const loadedDocumentKey = `${userId}:${documentId}`;

    if (loadedDocumentKeyRef.current === loadedDocumentKey) return;

    const savedDocument = loadSavedDocument(documentId, userId);

    if (savedDocument?.cells) {
      const previewFromSaved = Object.entries(savedDocument.cells).reduce(
        (accumulator, [key, cell]) => {
          const [rowText, colText] = key.split(':');

          const row = Number(rowText);
          const col = Number(colText);

          if (!accumulator[row]) {
            accumulator[row] = [];
          }

          accumulator[row][col] = (cell as { raw: string }).raw;

          return accumulator;
        },
        [] as string[][],
      );

      dispatch(loadCellsFromPreviewAction(previewFromSaved));
    } else {
      dispatch(loadCellsFromPreviewAction(currentDocument.preview));
    }

    loadedDocumentKeyRef.current = loadedDocumentKey;
  }, [currentDocument, dispatch, documentId, userId]);

  async function saveDocument() {
    if (!documentId || !userId) return;

    try {
      dispatch(setSaveStatus('saving'));

      await dispatch(
        saveDocumentThunk({
          userId,
          documentId,
          cells,
          updatedAt: new Date().toISOString(),
        }),
      ).unwrap();

      dispatch(setSaveStatus('saved'));
      dispatch(setUnsavedChanges(false));
    } catch {
      dispatch(setSaveStatus('error'));
    }
  }

  useEffect(() => {
    function handleSaveShortcut(event: KeyboardEvent) {
      const key = event.key?.toLowerCase() ?? '';

      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) &&
        (key === 's' || event.code === 'KeyS');

      if (!isSaveShortcut) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      saveDocument();
    }

    document.addEventListener('keydown', handleSaveShortcut, {
      capture: true,
    });

    return () => {
      document.removeEventListener('keydown', handleSaveShortcut, {
        capture: true,
      });
    };
  }, [cells, documentId, dispatch, userId]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (!documentId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <div className="page">Загрузка документа...</div>;
  }

  if (!currentDocument) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="page">
        <div className="topPanel">
      <div className="topPanelLeft">
        <button className="backButton" onClick={() => navigate('/dashboard')}>
          ←
        </button>

        <div className="documentTitle">
          {currentDocument.title}
        </div>
      </div>

      <div className="topPanelActions" />
    </div>

      <FormulaBar />
      <div className={`saveStatusBar saveStatusBar_${saveStatus}`}>
        {saveStatus === 'saved' && 'Сохранено'}
        {saveStatus === 'saving' && 'Сохранение...'}
        {saveStatus === 'error' && 'Ошибка сохранения'}
      </div>

      <main className="sheetShell">
        <SpreadsheetGrid />
      </main>

      <ContextMenu />
    </div>
  );
}