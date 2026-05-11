import { useEffect, useRef, useState } from 'react';
import type { CellPosition } from '../../types';
import { getCellKey, isCellInRange } from '../../cellUtils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  extendSelection,
  setActiveCell,
  setCellRaw,
  setEditingCell,
} from '../../store/slices/spreadsheetSlice';
import { setSaveStatus, setUnsavedChanges, openContextMenu} from '../../store/slices/uiSlice';

type CellProps = {
  position: CellPosition;
  width: number;
  height: number;
};

export function Cell({ position, width, height }: CellProps) {
  const { row, col } = position;

  const dispatch = useAppDispatch();

  const cell = useAppSelector((state) => state.spreadsheet.cells[getCellKey(row, col)]);
  const activeCell = useAppSelector((state) => state.spreadsheet.activeCell);
  const selection = useAppSelector((state) => state.spreadsheet.selection);
  const editingCell = useAppSelector((state) => state.spreadsheet.editingCell);

  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isActive = activeCell?.row === row && activeCell?.col === col;
  const isEditing = editingCell?.row === row && editingCell?.col === col;
  const isSelected = isCellInRange(row, col, selection);

  useEffect(() => {
    if (!isEditing) return;

    setDraft(cell?.raw ?? '');

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isEditing]);

 function stopEditing() {
  dispatch(setEditingCell(null));

  requestAnimationFrame(() => {
    const grid = document.querySelector<HTMLDivElement>('.gridViewport');
    grid?.focus();
  });
}

  return (
    <div
      className={[
        'cell',
        isActive ? 'cellActive' : '',
        isSelected ? 'cellSelected' : '',
        cell?.type === 'formula' ? 'cellFormula' : '',
      ].join(' ')}
      style={{ width, height, lineHeight: `${height - 2}px` }}
      onMouseDown={(event) => {
        if (event.button !== 0) return;
        dispatch(setActiveCell({ position, shiftKey: event.shiftKey }));
      }}
      onMouseEnter={(event) => {
        if (event.buttons === 1) {
          dispatch(extendSelection(position));
        }
      }}
      onDoubleClick={() => dispatch(setEditingCell(position))}
      onContextMenu={(event) => {
        event.preventDefault();

        dispatch(openContextMenu({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          row,
          col,
          target: 'cell',
        }));
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="cellEditor"
          value={draft}
          onChange={(event) => {
            const value = event.target.value;
            setDraft(value);
            dispatch(setCellRaw({ row, col, raw: value }));
            dispatch(setSaveStatus('saving'));
            dispatch(setUnsavedChanges(true));
          }}
          onBlur={stopEditing}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              stopEditing();
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              stopEditing();
            }
          }}
        />
      ) : (
        <span>{cell?.computed ?? ''}</span>
      )}
    </div>
  );
}