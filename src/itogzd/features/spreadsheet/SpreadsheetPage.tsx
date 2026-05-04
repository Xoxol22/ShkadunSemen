import { FormulaBar } from './FormulaBar';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { ContextMenu } from './ContextMenu';
import { useSpreadsheetStore } from '../../spreadsheetStore';

export function SpreadsheetPage() {
  const fillDemoData = useSpreadsheetStore((state) => state.fillDemoData);
  const setRows = useSpreadsheetStore((state) => state.setRows);

  return (
    <div className="page">
      <div className="topPanel">
        <button onClick={fillDemoData}>Demo data</button>
        <button onClick={() => setRows(1000)}>1000 rows</button>
        <button onClick={() => setRows(100)}>100 rows</button>
      </div>

      <FormulaBar />

      <main className="sheetShell">
        <SpreadsheetGrid />
      </main>

      <ContextMenu />
    </div>
  );
}