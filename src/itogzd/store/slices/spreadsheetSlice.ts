import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CellData, CellPosition, SelectionRange } from '../../types';
import {
  DEFAULT_COLS,
  DEFAULT_ROWS,
  getCellKey,
} from '../../cellUtils';
import { computeCell, recomputeAllCells } from '../../formulaEngine';

type SpreadsheetData = {
  cells: Record<string, CellData>;
};

type SpreadsheetState = {
  rows: number;
  cols: number;

  cells: Record<string, CellData>;

  activeCell: CellPosition | null;
  selection: SelectionRange | null;
  editingCell: CellPosition | null;
  formulaValue: string;

  past: SpreadsheetData[];
  future: SpreadsheetData[];
  columnWidths: Record<number, number>;
    rowHeights: Record<number, number>;
};

const initialState: SpreadsheetState = {
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,

  cells: {},

  activeCell: null,
  selection: null,
  editingCell: null,
  formulaValue: '',

  past: [],
  future: [],
  columnWidths: {},
  rowHeights: {},
};

function pushHistory(state: SpreadsheetState) {
  state.past.push({
    cells: state.cells,
  });

  state.future = [];

  if (state.past.length > 50) {
    state.past.shift();
  }
}

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',

  initialState,

  reducers: {
    setActiveCell(
      state,
      action: PayloadAction<{ position: CellPosition; shiftKey?: boolean }>,
    ) {
      const { position, shiftKey = false } = action.payload;
      const cell = state.cells[getCellKey(position.row, position.col)];
      const start = shiftKey && state.activeCell ? state.activeCell : position;

      state.activeCell = position;
      state.selection = { start, end: position };
      state.formulaValue = cell?.raw ?? '';
    },

    extendSelection(state, action: PayloadAction<CellPosition>) {
      const position = action.payload;

      if (!state.selection) {
        state.activeCell = position;
        state.selection = { start: position, end: position };
        return;
      }

      state.activeCell = position;
      state.selection = {
        start: state.selection.start,
        end: position,
      };
    },

    moveActiveCell(
      state,
      action: PayloadAction<{
        rowDelta: number;
        colDelta: number;
        shiftKey?: boolean;
      }>,
    ) {
      const { rowDelta, colDelta, shiftKey = false } = action.payload;
      const currentCell = state.activeCell ?? { row: 0, col: 0 };

      const next = {
        row: Math.min(Math.max(currentCell.row + rowDelta, 0), state.rows - 1),
        col: Math.min(Math.max(currentCell.col + colDelta, 0), state.cols - 1),
      };

      const cell = state.cells[getCellKey(next.row, next.col)];

      state.activeCell = next;
      state.selection = shiftKey
        ? {
            start: state.selection?.start ?? currentCell,
            end: next,
          }
        : {
            start: next,
            end: next,
          };
      state.formulaValue = cell?.raw ?? '';
    },

    setEditingCell(state, action: PayloadAction<CellPosition | null>) {
      state.editingCell = action.payload;
    },

    setCellRaw(
      state,
      action: PayloadAction<{ row: number; col: number; raw: string }>,
    ) {
      pushHistory(state);

      const { row, col, raw } = action.payload;
      const key = getCellKey(row, col);

      const nextCells = {
        ...state.cells,
        [key]: computeCell(raw, state.cells),
      };

      state.cells = recomputeAllCells(nextCells);
      state.formulaValue = raw;
    },

    setFormulaValue(state, action: PayloadAction<string>) {
      const value = action.payload;
      state.formulaValue = value;

      if (!state.activeCell) return;

      pushHistory(state);

      const key = getCellKey(state.activeCell.row, state.activeCell.col);

      const nextCells = {
        ...state.cells,
        [key]: computeCell(value, state.cells),
      };

      state.cells = recomputeAllCells(nextCells);
    },

    loadCellsFromPreview(state, action: PayloadAction<string[][]>) {
      const preview = action.payload;
      const cells: Record<string, CellData> = {};

      preview.forEach((rowValues, rowIndex) => {
        rowValues.forEach((value, colIndex) => {
          if (value !== '') {
            cells[getCellKey(rowIndex, colIndex)] = computeCell(value, cells);
          }
        });
      });

      state.cells = recomputeAllCells(cells);
      state.activeCell = { row: 0, col: 0 };
      state.selection = {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 0 },
      };
      state.formulaValue = preview[0]?.[0] ?? '';
      state.past = [];
      state.future = [];
    },

    setColumnWidth(
        state,
        action: PayloadAction<{ col: number; width: number }>,
        ) {
        state.columnWidths[action.payload.col] = Math.max(60, action.payload.width);
    },

    setRowHeight(
        state,
        action: PayloadAction<{ row: number; height: number }>,
        ) {
        state.rowHeights[action.payload.row] = Math.max(22, action.payload.height);
    },

    undo(state) {
      const previous = state.past.pop();

      if (!previous) return;

      state.future.unshift({
        cells: state.cells,
      });

      state.cells = previous.cells;
    },

    redo(state) {
      const next = state.future.shift();

      if (!next) return;

      state.past.push({
        cells: state.cells,
      });

      state.cells = next.cells;
    },
    insertRow(state, action: PayloadAction<number>) {
        state.rows += 1;
    },

    deleteRow(state, action: PayloadAction<number>) {
        if (state.rows <= 1) return;

        state.rows -= 1;
    },

    insertCol(state, action: PayloadAction<number>) {
        state.cols += 1;
    },

    deleteCol(state, action: PayloadAction<number>) {
        if (state.cols <= 1) return;

        state.cols -= 1;
    },
  },
});

export const {
  setActiveCell,
  extendSelection,
  moveActiveCell,
  setEditingCell,
  setCellRaw,
  setFormulaValue,
  loadCellsFromPreview,
  setColumnWidth,
  setRowHeight,
  undo,
  redo,
  insertRow,
    deleteRow,
    insertCol,
    deleteCol,
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;