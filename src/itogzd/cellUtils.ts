import type { CellPosition } from './types';

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

export function getCellLabel(row: number, col: number): string {
  return `${getColumnName(col)}${row + 1}`;
}

export function parseCellRef(ref: string): CellPosition | null {
  const match = ref.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
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