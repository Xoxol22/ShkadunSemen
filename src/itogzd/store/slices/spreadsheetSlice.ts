import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CellData, CellPosition, CellStyle, SelectionRange } from '../../types';
import { DEFAULT_COLS, DEFAULT_ROWS, getCellKey, normalizeRange } from '../../cellUtils';
import { computeCell, recomputeAllCells } from '../../formulaEngine';

type SpreadsheetData = {
	cells: Record<string, CellData>;
};

type ClipboardData = {
	cells: Record<string, CellData>;
	rowCount: number;
	colCount: number;
};

type SpreadsheetState = {
	rows: number;
	cols: number;

	cells: Record<string, CellData>;

	activeCell: CellPosition | null;
	selection: SelectionRange | null;
	editingCell: CellPosition | null;
	clipboard: ClipboardData | null;
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
	clipboard: null,

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

function cloneCell(cell: CellData): CellData {
	return {
		...cell,
		style: cell.style ? { ...cell.style } : undefined,
	};
}

function getEmptyCell(): CellData {
	return {
		raw: '',
		computed: '',
		type: 'empty',
	};
}

function getTargetRange(state: SpreadsheetState): SelectionRange | null {
	if (state.selection) {
		return normalizeRange(state.selection);
	}

	if (!state.activeCell) {
		return null;
	}

	return {
		start: state.activeCell,
		end: state.activeCell,
	};
}

function forEachCellInRange(
	range: SelectionRange,
	callback: (row: number, col: number) => void,
) {
	for (let row = range.start.row; row <= range.end.row; row++) {
		for (let col = range.start.col; col <= range.end.col; col++) {
			callback(row, col);
		}
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

			const previousCell = state.cells[key];

			const nextCells = {
				...state.cells,
				[key]: {
					...computeCell(raw, state.cells),
					style: previousCell?.style,
				},
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

			const previousCell = state.cells[key];

			const nextCells = {
				...state.cells,
				[key]: {
					...computeCell(value, state.cells),
					style: previousCell?.style,
				},
			};

			state.cells = recomputeAllCells(nextCells);
		},

		loadCells(state, action: PayloadAction<Record<string, CellData>>) {
			state.cells = recomputeAllCells(action.payload);

			state.activeCell = { row: 0, col: 0 };
			state.selection = {
				start: { row: 0, col: 0 },
				end: { row: 0, col: 0 },
			};
			state.formulaValue = state.cells[getCellKey(0, 0)]?.raw ?? '';
			state.past = [];
			state.future = [];
		},

		applyCellStyle(state, action: PayloadAction<CellStyle>) {
			const range = getTargetRange(state);

			if (!range) return;

			pushHistory(state);

			const nextCells = { ...state.cells };

			forEachCellInRange(range, (row, col) => {
				const key = getCellKey(row, col);
				const currentCell = nextCells[key] ?? getEmptyCell();

				nextCells[key] = {
					...currentCell,
					style: {
						...currentCell.style,
						...action.payload,
					},
				};
			});

			state.cells = nextCells;
		},

		toggleCellStyle(state, action: PayloadAction<'bold' | 'italic' | 'underline'>) {
			const range = getTargetRange(state);

			if (!range) return;

			const activeKey = state.activeCell
				? getCellKey(state.activeCell.row, state.activeCell.col)
				: null;

			const currentValue = activeKey
				? Boolean(state.cells[activeKey]?.style?.[action.payload])
				: false;

			pushHistory(state);

			const nextCells = { ...state.cells };

			forEachCellInRange(range, (row, col) => {
				const key = getCellKey(row, col);
				const currentCell = nextCells[key] ?? getEmptyCell();

				nextCells[key] = {
					...currentCell,
					style: {
						...currentCell.style,
						[action.payload]: !currentValue,
					},
				};
			});

			state.cells = nextCells;
		},

		setNumberFormat(state, action: PayloadAction<CellStyle['numberFormat']>) {
			const range = getTargetRange(state);

			if (!range) return;

			pushHistory(state);

			const nextCells = { ...state.cells };

			forEachCellInRange(range, (row, col) => {
				const key = getCellKey(row, col);
				const currentCell = nextCells[key] ?? getEmptyCell();

				nextCells[key] = {
					...currentCell,
					style: {
						...currentCell.style,
						numberFormat: action.payload,
					},
				};
			});

			state.cells = nextCells;
		},

		clearSelection(state) {
			const range = getTargetRange(state);

			if (!range) return;

			pushHistory(state);

			const nextCells = { ...state.cells };

			forEachCellInRange(range, (row, col) => {
				delete nextCells[getCellKey(row, col)];
			});

			state.cells = recomputeAllCells(nextCells);

			if (state.activeCell) {
				state.formulaValue = '';
			}
		},

		selectAll(state) {
			state.activeCell = { row: 0, col: 0 };
			state.selection = {
				start: { row: 0, col: 0 },
				end: { row: state.rows - 1, col: state.cols - 1 },
			};
		},

		copySelection(state) {
			const range = getTargetRange(state);

			if (!range) return;

			const copiedCells: Record<string, CellData> = {};

			forEachCellInRange(range, (row, col) => {
				const sourceKey = getCellKey(row, col);
				const relativeKey = getCellKey(
					row - range.start.row,
					col - range.start.col,
				);

				copiedCells[relativeKey] = state.cells[sourceKey]
					? cloneCell(state.cells[sourceKey])
					: getEmptyCell();
			});

			state.clipboard = {
				cells: copiedCells,
				rowCount: range.end.row - range.start.row + 1,
				colCount: range.end.col - range.start.col + 1,
			};
		},

		cutSelection(state) {
			const range = getTargetRange(state);

			if (!range) return;

			pushHistory(state);

			const copiedCells: Record<string, CellData> = {};
			const nextCells = { ...state.cells };

			forEachCellInRange(range, (row, col) => {
				const sourceKey = getCellKey(row, col);
				const relativeKey = getCellKey(
					row - range.start.row,
					col - range.start.col,
				);

				copiedCells[relativeKey] = nextCells[sourceKey]
					? cloneCell(nextCells[sourceKey])
					: getEmptyCell();

				delete nextCells[sourceKey];
			});

			state.clipboard = {
				cells: copiedCells,
				rowCount: range.end.row - range.start.row + 1,
				colCount: range.end.col - range.start.col + 1,
			};

			state.cells = recomputeAllCells(nextCells);
		},

		pasteClipboard(state) {
			if (!state.clipboard || !state.activeCell) return;

			pushHistory(state);

			const nextCells = { ...state.cells };

			for (let row = 0; row < state.clipboard.rowCount; row++) {
				for (let col = 0; col < state.clipboard.colCount; col++) {
					const sourceKey = getCellKey(row, col);
					const targetKey = getCellKey(
						state.activeCell.row + row,
						state.activeCell.col + col,
					);

					const sourceCell = state.clipboard.cells[sourceKey];

					if (!sourceCell || sourceCell.type === 'empty') {
						delete nextCells[targetKey];
					} else {
						nextCells[targetKey] = cloneCell(sourceCell);
					}
				}
			}

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

		setColumnWidth(state, action: PayloadAction<{ col: number; width: number }>) {
			state.columnWidths[action.payload.col] = Math.max(60, action.payload.width);
		},

		setRowHeight(state, action: PayloadAction<{ row: number; height: number }>) {
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
		insertRow(state, _action: PayloadAction<number>) {
			state.rows += 1;
		},

		deleteRow(state, _action: PayloadAction<number>) {
			if (state.rows <= 1) return;

			state.rows -= 1;
		},

		insertCol(state, _action: PayloadAction<number>) {
			state.cols += 1;
		},

		deleteCol(state, _action: PayloadAction<number>) {
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
	loadCells,
	applyCellStyle,
	toggleCellStyle,
	setNumberFormat,
	clearSelection,
	selectAll,
	copySelection,
	cutSelection,
	pasteClipboard,
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;
