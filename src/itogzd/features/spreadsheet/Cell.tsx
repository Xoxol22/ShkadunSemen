import { useEffect, useRef, useState } from 'react';
import type { CellPosition } from '../../types';
import { getCellKey, isCellInRange } from '../../cellUtils';
import { useSpreadsheetStore } from '../../spreadsheetStore';

type CellProps = {
  position: CellPosition;
  width: number;
  height: number;
};

export function Cell({ position, width, height }: CellProps) {
  const { row, col } = position;

  const cell = useSpreadsheetStore((state) => state.cells[getCellKey(row, col)]);
  const activeCell = useSpreadsheetStore((state) => state.activeCell);
  const selection = useSpreadsheetStore((state) => state.selection);
  const editingCell = useSpreadsheetStore((state) => state.editingCell);

  const setActiveCell = useSpreadsheetStore((state) => state.setActiveCell);
  const extendSelection = useSpreadsheetStore((state) => state.extendSelection);
  const setEditingCell = useSpreadsheetStore((state) => state.setEditingCell);
  const setCellRaw = useSpreadsheetStore((state) => state.setCellRaw);
  const openContextMenu = useSpreadsheetStore((state) => state.openContextMenu);

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
  setEditingCell(null);

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
        setActiveCell(position, event.shiftKey);
      }}
      onMouseEnter={(event) => {
        if (event.buttons === 1) {
          extendSelection(position);
        }
      }}
      onDoubleClick={() => setEditingCell(position)}
      onContextMenu={(event) => {
        event.preventDefault();

        openContextMenu({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          row,
          col,
          target: 'cell',
        });
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
            setCellRaw(row, col, value);
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