import { useEffect, useRef, useState } from 'react';
import { getCellKey, getColumnName } from '../../cellUtils';
import { useSpreadsheetStore } from '../../spreadsheetStore';

const ROWS = 100;
const COLS = 26;

const HEADER_WIDTH = 52;
const HEADER_HEIGHT = 32;
const CELL_WIDTH = 120;
const CELL_HEIGHT = 34;

export function SpreadsheetGrid() {
  const cells = useSpreadsheetStore((state) => state.cells);
  const activeCell = useSpreadsheetStore((state) => state.activeCell);
  const editingCell = useSpreadsheetStore((state) => state.editingCell);

  const setActiveCell = useSpreadsheetStore((state) => state.setActiveCell);
  const setEditingCell = useSpreadsheetStore((state) => state.setEditingCell);
  const setCellRaw = useSpreadsheetStore((state) => state.setCellRaw);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [draft, setDraft] = useState('');

  const rows = Array.from({ length: ROWS }, (_, index) => index);
  const cols = Array.from({ length: COLS }, (_, index) => index);

  useEffect(() => {
    if (!editingCell) return;

    const cell = cells[getCellKey(editingCell.row, editingCell.col)];
    setDraft(cell?.raw ?? '');

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [editingCell]);

  return (
    <div className="gridViewport">
      <div
        className="gridCanvas"
        style={{
          width: HEADER_WIDTH + COLS * CELL_WIDTH,
          height: HEADER_HEIGHT + ROWS * CELL_HEIGHT,
        }}
      >
        <div
          className="cornerHeader"
          style={{
            width: HEADER_WIDTH,
            height: HEADER_HEIGHT,
          }}
        />

        {cols.map((col) => (
          <div
            key={col}
            className="columnHeader"
            style={{
              left: HEADER_WIDTH + col * CELL_WIDTH,
              top: 0,
              width: CELL_WIDTH,
              height: HEADER_HEIGHT,
              lineHeight: `${HEADER_HEIGHT}px`,
            }}
          >
            {getColumnName(col)}
          </div>
        ))}

        {rows.map((row) => (
          <div
            key={row}
            className="rowHeader"
            style={{
              left: 0,
              top: HEADER_HEIGHT + row * CELL_HEIGHT,
              width: HEADER_WIDTH,
              height: CELL_HEIGHT,
              lineHeight: `${CELL_HEIGHT}px`,
            }}
          >
            {row + 1}
          </div>
        ))}

        {rows.map((row) =>
          cols.map((col) => {
            const key = getCellKey(row, col);
            const cell = cells[key];

            const isActive = activeCell.row === row && activeCell.col === col;
            const isEditing = editingCell?.row === row && editingCell?.col === col;

            return (
              <div
                key={key}
                className={[
                  'cell',
                  isActive ? 'cellActive' : '',
                  cell?.type === 'formula' ? 'cellFormula' : '',
                ].join(' ')}
                style={{
                  left: HEADER_WIDTH + col * CELL_WIDTH,
                  top: HEADER_HEIGHT + row * CELL_HEIGHT,
                  width: CELL_WIDTH,
                  height: CELL_HEIGHT,
                  lineHeight: `${CELL_HEIGHT}px`,
                }}
                onClick={() => setActiveCell({ row, col })}
                onDoubleClick={() => setEditingCell({ row, col })}
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
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setEditingCell(null);
                      }

                      if (event.key === 'Escape') {
                        setEditingCell(null);
                      }
                    }}
                    onBlur={() => setEditingCell(null)}
                  />
                ) : (
                  <span>{cell?.computed ?? ''}</span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}