import { useSyncExternalStore } from 'react';
import type { CellData, CellPosition, ContextMenuState, SelectionRange } from './types';
import {
  DEFAULT_COL_WIDTH,
  DEFAULT_COLS,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_ROWS,
  getCellKey,
} from './cellUtils';
import { computeCell, recomputeAllCells } from './formulaEngine';

type SpreadsheetState = {
  rows: number;
  cols: number;
  cells: Record<string, CellData>;
  activeCell: CellPosition | null;
  selection: SelectionRange | null;
  editingCell: CellPosition | null;
  formulaValue: string;
  columnWidths: Record<number, number>;
  rowHeights: Record<number, number>;
  contextMenu: ContextMenuState;
};

type SpreadsheetActions = {
  setActiveCell: (position: CellPosition, shiftKey?: boolean) => void;
  extendSelection: (position: CellPosition) => void;
  moveActiveCell: (rowDelta: number, colDelta: number, shiftKey?: boolean) => void;
  setEditingCell: (position: CellPosition | null) => void;
  setCellRaw: (row: number, col: number, raw: string) => void;
  setFormulaValue: (value: string) => void;
  insertRow: (row: number) => void;
  deleteRow: (row: number) => void;
  insertCol: (col: number) => void;
  deleteCol: (col: number) => void;
  setColumnWidth: (col: number, width: number) => void;
  setRowHeight: (row: number, height: number) => void;
  openContextMenu: (menu: ContextMenuState) => void;
  closeContextMenu: () => void;
  fillDemoData: () => void;
  setRows: (rows: number) => void;
};

type Store = SpreadsheetState & SpreadsheetActions;

let state: Store;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(updater: (state: Store) => Partial<Store>) {
  state = { ...state, ...updater(state) };
  emit();
}

function shiftCellsOnInsertRow(cells: Record<string, CellData>, insertAt: number) {
  const next: Record<string, CellData> = {};

  for (const [key, cell] of Object.entries(cells)) {
    const [rowText, colText] = key.split(':');
    const row = Number(rowText);
    const col = Number(colText);

    const nextRow = row >= insertAt ? row + 1 : row;
    next[getCellKey(nextRow, col)] = cell;
  }

  return next;
}

function shiftCellsOnDeleteRow(cells: Record<string, CellData>, deleteAt: number) {
  const next: Record<string, CellData> = {};

  for (const [key, cell] of Object.entries(cells)) {
    const [rowText, colText] = key.split(':');
    const row = Number(rowText);
    const col = Number(colText);

    if (row === deleteAt) continue;

    const nextRow = row > deleteAt ? row - 1 : row;
    next[getCellKey(nextRow, col)] = cell;
  }

  return next;
}

function shiftCellsOnInsertCol(cells: Record<string, CellData>, insertAt: number) {
  const next: Record<string, CellData> = {};

  for (const [key, cell] of Object.entries(cells)) {
    const [rowText, colText] = key.split(':');
    const row = Number(rowText);
    const col = Number(colText);

    const nextCol = col >= insertAt ? col + 1 : col;
    next[getCellKey(row, nextCol)] = cell;
  }

  return next;
}

function shiftCellsOnDeleteCol(cells: Record<string, CellData>, deleteAt: number) {
  const next: Record<string, CellData> = {};

  for (const [key, cell] of Object.entries(cells)) {
    const [rowText, colText] = key.split(':');
    const row = Number(rowText);
    const col = Number(colText);

    if (col === deleteAt) continue;

    const nextCol = col > deleteAt ? col - 1 : col;
    next[getCellKey(row, nextCol)] = cell;
  }

  return next;
}

state = {
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  cells: {},
  activeCell: null,
  selection: null,
  editingCell: null,
  formulaValue: '',
  columnWidths: {},
  rowHeights: {},
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    row: 0,
    col: 0,
    target: 'cell',
  },

  setActiveCell(position, shiftKey = false) {
    setState((current) => {
      const cell = current.cells[getCellKey(position.row, position.col)];
      const start = shiftKey && current.activeCell ? current.activeCell : position;

      return {
        activeCell: position,
        selection: { start, end: position },
        formulaValue: cell?.raw ?? '',
      };
    });
  },

  extendSelection(position) {
    setState((current) => {
      if (!current.selection) {
        return {
          activeCell: position,
          selection: { start: position, end: position },
        };
      }

      return {
        activeCell: position,
        selection: {
          start: current.selection.start,
          end: position,
        },
      };
    });
  },

  moveActiveCell(rowDelta, colDelta, shiftKey = false) {
    setState((current) => {
      const currentCell = current.activeCell ?? { row: 0, col: 0 };

      const next = {
        row: Math.min(Math.max(currentCell.row + rowDelta, 0), current.rows - 1),
        col: Math.min(Math.max(currentCell.col + colDelta, 0), current.cols - 1),
      };

      const cell = current.cells[getCellKey(next.row, next.col)];

      return {
        activeCell: next,
        selection: shiftKey
          ? {
              start: current.selection?.start ?? currentCell,
              end: next,
            }
          : {
              start: next,
              end: next,
            },
        formulaValue: cell?.raw ?? '',
      };
    });
  },

  setEditingCell(position) {
    setState(() => ({ editingCell: position }));
  },

  setCellRaw(row, col, raw) {
    setState((current) => {
      const key = getCellKey(row, col);
      const nextCells = {
        ...current.cells,
        [key]: computeCell(raw, current.cells),
      };

      return {
        cells: recomputeAllCells(nextCells),
        formulaValue: raw,
      };
    });
  },

  setFormulaValue(value) {
    setState((current) => {
      if (!current.activeCell) {
        return { formulaValue: value };
      }

      const key = getCellKey(current.activeCell.row, current.activeCell.col);
      const nextCells = {
        ...current.cells,
        [key]: computeCell(value, current.cells),
      };

      return {
        formulaValue: value,
        cells: recomputeAllCells(nextCells),
      };
    });
  },

  insertRow(row) {
    setState((current) => ({
      rows: current.rows + 1,
      cells: recomputeAllCells(shiftCellsOnInsertRow(current.cells, row)),
      contextMenu: { ...current.contextMenu, visible: false },
    }));
  },

  deleteRow(row) {
    setState((current) => ({
      rows: Math.max(1, current.rows - 1),
      cells: recomputeAllCells(shiftCellsOnDeleteRow(current.cells, row)),
      contextMenu: { ...current.contextMenu, visible: false },
    }));
  },

  insertCol(col) {
    setState((current) => ({
      cols: current.cols + 1,
      cells: recomputeAllCells(shiftCellsOnInsertCol(current.cells, col)),
      contextMenu: { ...current.contextMenu, visible: false },
    }));
  },

  deleteCol(col) {
    setState((current) => ({
      cols: Math.max(1, current.cols - 1),
      cells: recomputeAllCells(shiftCellsOnDeleteCol(current.cells, col)),
      contextMenu: { ...current.contextMenu, visible: false },
    }));
  },

  setColumnWidth(col, width) {
    setState((current) => ({
      columnWidths: {
        ...current.columnWidths,
        [col]: Math.max(60, width),
      },
    }));
  },

  setRowHeight(row, height) {
    setState((current) => ({
      rowHeights: {
        ...current.rowHeights,
        [row]: Math.max(22, height),
      },
    }));
  },

  openContextMenu(menu) {
    setState(() => ({ contextMenu: menu }));
  },

  closeContextMenu() {
    setState((current) => ({
      contextMenu: { ...current.contextMenu, visible: false },
    }));
  },

  fillDemoData() {
    const cells: Record<string, CellData> = {};

    cells[getCellKey(0, 0)] = computeCell('10', cells);
    cells[getCellKey(1, 0)] = computeCell('20', cells);
    cells[getCellKey(2, 0)] = computeCell('30', cells);
    cells[getCellKey(3, 0)] = computeCell('=SUM(A1:A3)', cells);
    cells[getCellKey(4, 0)] = computeCell('=AVERAGE(A1:A3)', cells);

    setState(() => ({ cells: recomputeAllCells(cells) }));
  },

  setRows(rows) {
    setState(() => ({
      rows: Math.max(1, rows),
    }));
  },
};

export function useSpreadsheetStore<T>(selector: (state: Store) => T): T {
  return useSyncExternalStore(
    (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => selector(state),
    () => selector(state),
  );
}

export function getColumnWidth(widths: Record<number, number>, col: number): number {
  return widths[col] ?? DEFAULT_COL_WIDTH;
}

export function getRowHeight(heights: Record<number, number>, row: number): number {
  return heights[row] ?? DEFAULT_ROW_HEIGHT;
}