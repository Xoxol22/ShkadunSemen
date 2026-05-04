import { useSpreadsheetStore } from '../../spreadsheetStore';
import { getCellLabel } from '../../cellUtils';

export function FormulaBar() {
  const activeCell = useSpreadsheetStore((state) => state.activeCell);
  const formulaValue = useSpreadsheetStore((state) => state.formulaValue);
  const setFormulaValue = useSpreadsheetStore((state) => state.setFormulaValue);

  return (
    <div className="formulaBar">
      <div className="cellName">
        {activeCell ? getCellLabel(activeCell.row, activeCell.col) : ''}
      </div>

      <input
        value={formulaValue}
        onChange={(event) => setFormulaValue(event.target.value)}
      />
    </div>
  );
}