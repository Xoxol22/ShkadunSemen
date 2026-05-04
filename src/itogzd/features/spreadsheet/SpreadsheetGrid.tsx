import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { Cell } from './Cell';
import { getColumnName, DEFAULT_ROW_HEIGHT } from '../../cellUtils';
import {
  getColumnWidth,
  getRowHeight,
  useSpreadsheetStore,
} from '../../spreadsheetStore';

const HEADER_WIDTH = 52;
const HEADER_HEIGHT = 32;
const OVERSCAN = 8;

export function SpreadsheetGrid() {
  const rows = useSpreadsheetStore((state) => state.rows);
  const cols = useSpreadsheetStore((state) => state.cols);
  const activeCell = useSpreadsheetStore((state) => state.activeCell);
  const editingCell = useSpreadsheetStore((state) => state.editingCell);

  const columnWidths = useSpreadsheetStore((state) => state.columnWidths);
  const rowHeights = useSpreadsheetStore((state) => state.rowHeights);

  const setColumnWidth = useSpreadsheetStore((state) => state.setColumnWidth);
  const setRowHeight = useSpreadsheetStore((state) => state.setRowHeight);
  const moveActiveCell = useSpreadsheetStore((state) => state.moveActiveCell);
  const setActiveCell = useSpreadsheetStore((state) => state.setActiveCell);
  const setEditingCell = useSpreadsheetStore((state) => state.setEditingCell);
  const setCellRaw = useSpreadsheetStore((state) => state.setCellRaw);
  const openContextMenu = useSpreadsheetStore((state) => state.openContextMenu);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const [viewport, setViewport] = useState({ width: 1000, height: 600 });

  const columnOffsets = useMemo(() => {
    const offsets: number[] = [];
    let current = 0;

    for (let col = 0; col < cols; col++) {
      offsets[col] = current;
      current += getColumnWidth(columnWidths, col);
    }

    return { offsets, total: current };
  }, [cols, columnWidths]);

  const rowOffsets = useMemo(() => {
    const offsets: number[] = [];
    let current = 0;

    for (let row = 0; row < rows; row++) {
      offsets[row] = current;
      current += getRowHeight(rowHeights, row);
    }

    return { offsets, total: current };
  }, [rows, rowHeights]);

  const visibleCols = useMemo(() => {
    const result: number[] = [];
    const from = scroll.left;
    const to = scroll.left + viewport.width;

    for (let col = 0; col < cols; col++) {
      const left = columnOffsets.offsets[col] ?? 0;
      const width = getColumnWidth(columnWidths, col);

      if (left + width >= from - OVERSCAN * 100 && left <= to + OVERSCAN * 100) {
        result.push(col);
      }
    }

    return result;
  }, [cols, columnOffsets, columnWidths, scroll.left, viewport.width]);

  const visibleRows = useMemo(() => {
    const result: number[] = [];
    const from = scroll.top;
    const to = scroll.top + viewport.height;

    for (let row = 0; row < rows; row++) {
      const top = rowOffsets.offsets[row] ?? 0;
      const height = getRowHeight(rowHeights, row);

      if (
        top + height >= from - OVERSCAN * DEFAULT_ROW_HEIGHT &&
        top <= to + OVERSCAN * DEFAULT_ROW_HEIGHT
      ) {
        result.push(row);
      }
    }

    return result;
  }, [rows, rowOffsets, rowHeights, scroll.top, viewport.height]);

  function startColumnResize(event: MouseEvent<HTMLSpanElement>, col: number) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = getColumnWidth(columnWidths, col);

    function move(moveEvent: globalThis.MouseEvent) {
      setColumnWidth(col, startWidth + moveEvent.clientX - startX);
    }

    function up() {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    }

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  function startRowResize(event: MouseEvent<HTMLSpanElement>, row: number) {
    event.preventDefault();
    event.stopPropagation();

    const startY = event.clientY;
    const startHeight = getRowHeight(rowHeights, row);

    function move(moveEvent: globalThis.MouseEvent) {
      setRowHeight(row, startHeight + moveEvent.clientY - startY);
    }

    function up() {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    }

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  return (
    <div
      ref={containerRef}
      className="gridViewport"
      tabIndex={0}
      onKeyDown={(event) => {
        if (editingCell) return;

        if (!activeCell) {
          setActiveCell({ row: 0, col: 0 });
          return;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          setEditingCell(activeCell);
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          moveActiveCell(-1, 0, event.shiftKey);
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          moveActiveCell(1, 0, event.shiftKey);
          return;
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          moveActiveCell(0, -1, event.shiftKey);
          return;
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          moveActiveCell(0, 1, event.shiftKey);
          return;
        }

        if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          event.preventDefault();
          setCellRaw(activeCell.row, activeCell.col, event.key);
          setEditingCell(activeCell);
        }
      }}
      onScroll={(event) => {
        const el = event.currentTarget;

        setScroll({
          top: el.scrollTop,
          left: el.scrollLeft,
        });

        setViewport({
          width: el.clientWidth,
          height: el.clientHeight,
        });
      }}
      onMouseDown={(event) => {
        if (event.target instanceof HTMLInputElement) return;

        requestAnimationFrame(() => {
            containerRef.current?.focus();
        });
        }}
      onMouseEnter={() => {
        const el = containerRef.current;
        if (!el) return;

        setViewport({
          width: el.clientWidth,
          height: el.clientHeight,
        });
      }}
    >
      <div
        className="gridCanvas"
        style={{
          width: columnOffsets.total + HEADER_WIDTH,
          height: rowOffsets.total + HEADER_HEIGHT,
        }}
      >
        <div
          className="cornerHeader"
          style={{
            width: HEADER_WIDTH,
            height: HEADER_HEIGHT,
          }}
        />

        {visibleCols.map((col) => {
          const left = HEADER_WIDTH + (columnOffsets.offsets[col] ?? 0);
          const width = getColumnWidth(columnWidths, col);

          return (
            <div
              key={col}
              className="columnHeader"
              style={{
                left,
                top: 0,
                width,
                height: HEADER_HEIGHT,
                lineHeight: `${HEADER_HEIGHT}px`,
              }}
              onContextMenu={(event) => {
                event.preventDefault();

                openContextMenu({
                  visible: true,
                  x: event.clientX,
                  y: event.clientY,
                  row: 0,
                  col,
                  target: 'col',
                });
              }}
            >
              {getColumnName(col)}

              <span
                className="columnResizer"
                onMouseDown={(event) => startColumnResize(event, col)}
              />
            </div>
          );
        })}

        {visibleRows.map((row) => {
          const top = HEADER_HEIGHT + (rowOffsets.offsets[row] ?? 0);
          const height = getRowHeight(rowHeights, row);

          return (
            <div
              key={row}
              className="rowHeader"
              style={{
                left: 0,
                top,
                width: HEADER_WIDTH,
                height,
                lineHeight: `${height}px`,
              }}
              onContextMenu={(event) => {
                event.preventDefault();

                openContextMenu({
                  visible: true,
                  x: event.clientX,
                  y: event.clientY,
                  row,
                  col: 0,
                  target: 'row',
                });
              }}
            >
              {row + 1}

              <span
                className="rowResizer"
                onMouseDown={(event) => startRowResize(event, row)}
              />
            </div>
          );
        })}

        {visibleRows.map((row) =>
          visibleCols.map((col) => {
            const left = HEADER_WIDTH + (columnOffsets.offsets[col] ?? 0);
            const top = HEADER_HEIGHT + (rowOffsets.offsets[row] ?? 0);
            const width = getColumnWidth(columnWidths, col);
            const height = getRowHeight(rowHeights, row);

            return (
              <div
                key={`${row}:${col}`}
                className="cellWrapper"
                style={{
                  left,
                  top,
                  width,
                  height,
                }}
              >
                <Cell position={{ row, col }} width={width} height={height} />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}