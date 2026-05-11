import { getCellLabel } from '../../cellUtils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSaveStatus, setUnsavedChanges } from '../../store/slices/uiSlice';
import { setFormulaValue } from '../../store/slices/spreadsheetSlice';

export function FormulaBar() {

  const dispatch = useAppDispatch();

  const activeCell = useAppSelector((state) => state.spreadsheet.activeCell);
  const formulaValue = useAppSelector((state) => state.spreadsheet.formulaValue);

  return (
    <div className="formulaBar">
      <div className="cellName">
        {activeCell ? getCellLabel(activeCell.row, activeCell.col) : ''}
      </div>

      <input
        value={formulaValue}
        onChange={(event) => {
          dispatch(setFormulaValue(event.target.value));

          dispatch(setSaveStatus('saving'));
          dispatch(setUnsavedChanges(true));
        }}
      />
    </div>
  );
}