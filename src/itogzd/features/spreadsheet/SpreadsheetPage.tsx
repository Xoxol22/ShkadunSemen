import { SpreadsheetGrid } from './SpreadsheetGrid';
import { useSpreadsheetStore } from '../../spreadsheetStore';
import { getCellLabel } from '../../cellUtils';

export function SpreadsheetPage() {
  const activeCell = useSpreadsheetStore((state) => state.activeCell);
  const formulaValue = useSpreadsheetStore((state) => state.formulaValue);
  const setFormulaValue = useSpreadsheetStore((state) => state.setFormulaValue);

  return (
    <div className="page">
      <div className="topPanel">
        <button>Demo data</button>
        <button>1000 rows</button>
        <button>100 rows</button>
      </div>

      <div className="formulaBar">
        <div className="cellName">
          {getCellLabel(activeCell.row, activeCell.col)}
        </div>

        <input
          value={formulaValue}
          onChange={(event) => setFormulaValue(event.target.value)}
        />
      </div>

      <main className="sheetShell">
        <SpreadsheetGrid />
      </main>
    </div>
  );
}