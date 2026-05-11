import { FormulaBar } from './FormulaBar';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { ContextMenu } from './ContextMenu';
import { useSpreadsheetStore } from '../../spreadsheetStore';
import { useEffect, useRef } from 'react';
import { patchDocument, loadSavedDocument } from '../documents/mockDocumentsApi';

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
  const fillDemoData = useSpreadsheetStore((state) => state.fillDemoData);
  const setRows = useSpreadsheetStore((state) => state.setRows);
  const saveStatus = useSpreadsheetStore((state) => state.saveStatus);

  const cells = useSpreadsheetStore((state) => state.cells);
  const hasUnsavedChanges = useSpreadsheetStore((state) => state.hasUnsavedChanges);
  const setSaveStatus = useSpreadsheetStore((state) => state.setSaveStatus);
  const setUnsavedChanges = useSpreadsheetStore((state) => state.setUnsavedChanges);
  const loadCellsFromPreview = useSpreadsheetStore((state) => state.loadCellsFromPreview);

  const saveTimerRef = useRef<number | null>(null);
  const hasLoadedRef = useRef(false);

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

      loadCellsFromPreview(previewFromSaved);
    } else {
      loadCellsFromPreview(preview);
    }

    hasLoadedRef.current = true;
  }, [documentId, loadCellsFromPreview, preview]);

  async function saveDocument() {
    try {
      setSaveStatus('saving');

      await patchDocument(documentId, {
        cells,
        updatedAt: new Date().toISOString(),
      });

      setSaveStatus('saved');
      setUnsavedChanges(false);
    } catch {
      setSaveStatus('error');
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
        setSaveStatus('saving');

        await patchDocument(documentId, {
          cells,
          updatedAt: new Date().toISOString(),
        });

        setSaveStatus('saved');
        setUnsavedChanges(false);
      } catch {
        setSaveStatus('error');
      }
    }, 60000);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [cells, documentId, hasUnsavedChanges, setSaveStatus, setUnsavedChanges]);

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

      <div className="topPanelActions">
        <button onClick={fillDemoData}>Demo data</button>
      </div>
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