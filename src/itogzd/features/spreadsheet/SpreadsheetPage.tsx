import { SpreadsheetGrid } from './SpreadsheetGrid';

export function SpreadsheetPage() {
  return (
    <div className="page">
      <div className="topPanel">
        <button>Demo data</button>
        <button>1000 rows</button>
        <button>100 rows</button>
      </div>

      <div className="formulaBar">
        <div className="cellName">A1</div>
        <input />
      </div>

      <main className="sheetShell">
        <SpreadsheetGrid />
      </main>
    </div>
  );
}