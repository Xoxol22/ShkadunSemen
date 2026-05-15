import { FormulaBar } from '../features/spreadsheet/FormulaBar';
import { SpreadsheetGrid } from '../features/spreadsheet/SpreadsheetGrid';
import { ContextMenu } from '../features/spreadsheet/ContextMenu';
import { loadCellsFromPreview as loadCellsFromPreviewAction } from '../store/slices/spreadsheetSlice';
import { useEffect, useRef } from 'react';
import { loadSavedDocument } from '../features/documents/mockDocumentsApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSaveStatus, setUnsavedChanges } from '../store/slices/uiSlice';
import { saveDocument as saveDocumentThunk } from '../store/slices/documentsSlice';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { loadDocuments } from '../store/slices/documentsSlice';

export function SpreadsheetPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const documents = useAppSelector((state) => state.documents.items);
  const isLoading = useAppSelector((state) => state.documents.isLoading);

  const currentDocument = documents.find(
    (document) => document.id === documentId,
  );

  const loadedDocumentIdRef = useRef<string | null>(null);

  const dispatch = useAppDispatch();
  const cells = useAppSelector((state) => state.spreadsheet.cells);

  const saveStatus = useAppSelector((state) => state.ui.saveStatus);
  const hasUnsavedChanges = useAppSelector((state) => state.ui.hasUnsavedChanges);

  useEffect(() => {
    if (documents.length === 0) {
      dispatch(loadDocuments());
    }
  }, [dispatch, documents.length]);

  useEffect(() => {
    if (!documentId || !currentDocument) return;

    if (loadedDocumentIdRef.current === documentId) return;

    const savedDocument = loadSavedDocument(documentId);

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

    loadedDocumentIdRef.current = documentId;
  }, [currentDocument, dispatch, documentId]);

  async function saveDocument() {
    if (!documentId) return;
    
    try {
      dispatch(setSaveStatus('saving'));

      await dispatch(
        saveDocumentThunk({
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
      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === 's' || event.code === 'KeyS');

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
  }, [cells, documentId, dispatch]);

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

  if (!documentId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading || documents.length === 0) {
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