import { FormulaBar } from './FormulaBar';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { ContextMenu } from './ContextMenu';
import { loadCellsFromPreview as loadCellsFromPreviewAction } from '../../store/slices/spreadsheetSlice';
import { useEffect, useRef } from 'react';
import { loadSavedDocument } from '../documents/mockDocumentsApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSaveStatus, setUnsavedChanges } from '../../store/slices/uiSlice';
import { saveDocument as saveDocumentThunk } from '../../store/slices/documentsSlice';

type SpreadsheetPageProps = {
  documentId: string;
  documentTitle: string;
  preview: string[][];
  onBack: () => void;
};

export function SpreadsheetPage({
  documentId,
  documentTitle,
  preview,
  onBack,
}: SpreadsheetPageProps) {

  const saveTimerRef = useRef<number | null>(null);
  const hasLoadedRef = useRef(false);

  const dispatch = useAppDispatch();
  const cells = useAppSelector((state) => state.spreadsheet.cells);

  const saveStatus = useAppSelector((state) => state.ui.saveStatus);
  const hasUnsavedChanges = useAppSelector((state) => state.ui.hasUnsavedChanges);

  useEffect(() => {
    if (hasLoadedRef.current) return;

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
      dispatch(loadCellsFromPreviewAction(preview));
    }

    hasLoadedRef.current = true;
  }, [documentId, dispatch, preview]);

  async function saveDocument() {
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
  }, [cells, documentId]);

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

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
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
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [cells, documentId, hasUnsavedChanges, dispatch]);

  return (
    <div className="page">
        <div className="topPanel">
      <div className="topPanelLeft">
        <button className="backButton" onClick={onBack}>
          ←
        </button>

        <div className="documentTitle">
          {documentTitle}
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