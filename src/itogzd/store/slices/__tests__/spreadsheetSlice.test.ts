import { describe, expect, it } from 'vitest';
import spreadsheetReducer, {
	deleteCol,
	deleteRow,
	extendSelection,
	insertCol,
	insertRow,
	loadCellsFromPreview,
	moveActiveCell,
	redo,
	setActiveCell,
	setCellRaw,
	setColumnWidth,
	setEditingCell,
	setFormulaValue,
	setRowHeight,
	undo,
} from '../spreadsheetSlice';

describe('spreadsheetSlice', () => {
	it('загружает ячейки из preview', () => {
		const state = spreadsheetReducer(
			undefined,
			loadCellsFromPreview([
				['10', '20'],
				['30', '=SUM(A1:A2)'],
			]),
		);

		expect(state.cells['0:0'].raw).toBe('10');
		expect(state.cells['0:1'].raw).toBe('20');
		expect(state.activeCell).toEqual({ row: 0, col: 0 });
	});

	it('выбирает активную ячейку', () => {
		const state = spreadsheetReducer(
			undefined,
			setActiveCell({
				position: { row: 2, col: 3 },
			}),
		);

		expect(state.activeCell).toEqual({ row: 2, col: 3 });
		expect(state.selection?.start).toEqual({ row: 2, col: 3 });
	});

	it('расширяет выделение', () => {
		const selected = spreadsheetReducer(
			undefined,
			setActiveCell({
				position: { row: 0, col: 0 },
			}),
		);

		const state = spreadsheetReducer(
			selected,
			extendSelection({ row: 2, col: 2 }),
		);

		expect(state.selection?.start).toEqual({ row: 0, col: 0 });
		expect(state.selection?.end).toEqual({ row: 2, col: 2 });
	});

	it('перемещает активную ячейку', () => {
		const selected = spreadsheetReducer(
			undefined,
			setActiveCell({
				position: { row: 0, col: 0 },
			}),
		);

		const state = spreadsheetReducer(
			selected,
			moveActiveCell({
				rowDelta: 1,
				colDelta: 1,
			}),
		);

		expect(state.activeCell).toEqual({ row: 1, col: 1 });
	});

	it('включает режим редактирования', () => {
		const state = spreadsheetReducer(
			undefined,
			setEditingCell({ row: 1, col: 1 }),
		);

		expect(state.editingCell).toEqual({ row: 1, col: 1 });
	});

	it('записывает значение в ячейку', () => {
		const state = spreadsheetReducer(
			undefined,
			setCellRaw({
				row: 0,
				col: 0,
				raw: '123',
			}),
		);

		expect(state.cells['0:0'].raw).toBe('123');
		expect(state.cells['0:0'].computed).toBe(123);
	});

	it('считает формулу SUM', () => {
		let state = spreadsheetReducer(
			undefined,
			setCellRaw({
				row: 0,
				col: 0,
				raw: '10',
			}),
		);

		state = spreadsheetReducer(
			state,
			setCellRaw({
				row: 1,
				col: 0,
				raw: '20',
			}),
		);

		state = spreadsheetReducer(
			state,
			setCellRaw({
				row: 2,
				col: 0,
				raw: '=SUM(A1:A2)',
			}),
		);

		expect(state.cells['2:0'].computed).toBe(30);
	});

	it('изменяет значение через строку формул', () => {
		let state = spreadsheetReducer(
			undefined,
			setActiveCell({
				position: { row: 0, col: 0 },
			}),
		);

		state = spreadsheetReducer(state, setFormulaValue('55'));

		expect(state.cells['0:0'].computed).toBe(55);
		expect(state.formulaValue).toBe('55');
	});

	it('изменяет размер колонки и строки', () => {
		let state = spreadsheetReducer(
			undefined,
			setColumnWidth({
				col: 1,
				width: 150,
			}),
		);

		state = spreadsheetReducer(
			state,
			setRowHeight({
				row: 2,
				height: 40,
			}),
		);

		expect(state.columnWidths[1]).toBe(150);
		expect(state.rowHeights[2]).toBe(40);
	});

	it('добавляет и удаляет строки', () => {
		let state = spreadsheetReducer(undefined, insertRow(0));

		expect(state.rows).toBeGreaterThan(100);

		state = spreadsheetReducer(state, deleteRow(0));

		expect(state.rows).toBe(100);
	});

	it('добавляет и удаляет столбцы', () => {
		let state = spreadsheetReducer(undefined, insertCol(0));

		expect(state.cols).toBeGreaterThan(26);

		state = spreadsheetReducer(state, deleteCol(0));

		expect(state.cols).toBe(26);
	});

	it('отменяет и повторяет изменение ячейки', () => {
		let state = spreadsheetReducer(
			undefined,
			setCellRaw({
				row: 0,
				col: 0,
				raw: '10',
			}),
		);

		state = spreadsheetReducer(
			state,
			setCellRaw({
				row: 0,
				col: 0,
				raw: '20',
			}),
		);

		expect(state.cells['0:0'].computed).toBe(20);

		state = spreadsheetReducer(state, undo());

		expect(state.cells['0:0'].computed).toBe(10);

		state = spreadsheetReducer(state, redo());

		expect(state.cells['0:0'].computed).toBe(20);
	});
});