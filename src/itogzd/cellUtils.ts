import type { CellPosition, SelectionRange } from './types';

export const DEFAULT_ROWS = 100;
export const DEFAULT_COLS = 26;
export const DEFAULT_ROW_HEIGHT = 28;
export const DEFAULT_COL_WIDTH = 100;

export function getCellKey(row: number, col: number): string {
	return `${row}:${col}`;
}

export function getColumnName(col: number): string {
	let name = '';
	let n = col + 1;

	while (n > 0) {
		const rem = (n - 1) % 26;
		name = String.fromCharCode(65 + rem) + name;
		n = Math.floor((n - 1) / 26);
	}

	return name;
}

export function parseCellRef(ref: string): CellPosition | null {
	const match = ref
		.trim()
		.toUpperCase()
		.match(/^([A-Z]+)(\d+)$/);
	if (!match) return null;

	const letters = match[1];
	const rowText = match[2];

	if (!letters || !rowText) return null;

	let col = 0;

	for (const letter of letters) {
		col = col * 26 + (letter.charCodeAt(0) - 64);
	}

	return {
		row: Number(rowText) - 1,
		col: col - 1,
	};
}

export function getCellLabel(row: number, col: number): string {
	return `${getColumnName(col)}${row + 1}`;
}

export function normalizeRange(range: SelectionRange): SelectionRange {
	return {
		start: {
			row: Math.min(range.start.row, range.end.row),
			col: Math.min(range.start.col, range.end.col),
		},
		end: {
			row: Math.max(range.start.row, range.end.row),
			col: Math.max(range.start.col, range.end.col),
		},
	};
}

export function isCellInRange(
	row: number,
	col: number,
	range: SelectionRange | null,
): boolean {
	if (!range) return false;

	const normalized = normalizeRange(range);

	return (
		row >= normalized.start.row &&
		row <= normalized.end.row &&
		col >= normalized.start.col &&
		col <= normalized.end.col
	);
}
