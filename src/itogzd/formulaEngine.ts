import type { CellData } from './types';
import { getCellKey, parseCellRef } from './cellUtils';

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getCellNumber(cells: Record<string, CellData>, ref: string): number {
  const position = parseCellRef(ref);
  if (!position) return 0;

  const cell = cells[getCellKey(position.row, position.col)];
  return toNumber(cell?.computed ?? cell?.raw ?? 0);
}

function getRangeValues(cells: Record<string, CellData>, range: string): number[] {
  const [from, to] = range.split(':');
  if (!from || !to) return [];

  const start = parseCellRef(from);
  const end = parseCellRef(to);

  if (!start || !end) return [];

  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);

  const values: number[] = [];

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cell = cells[getCellKey(row, col)];
      const value = cell?.computed ?? cell?.raw;

      if (value === '' || value === undefined) continue;

      values.push(toNumber(value));
    }
  }

  return values;
}

export function detectCellType(raw: string): CellData['type'] {
  const value = raw.trim();

  if (!value) return 'empty';
  if (value.startsWith('=')) return 'formula';
  if (value === 'true' || value === 'false') return 'boolean';
  if (!Number.isNaN(Number(value))) return 'number';

  return 'string';
}

export function computeCell(raw: string, cells: Record<string, CellData>): CellData {
  const type = detectCellType(raw);

  if (type === 'empty') {
    return { raw, computed: '', type };
  }

  if (type === 'number') {
    return { raw, computed: Number(raw), type };
  }

  if (type === 'boolean') {
    return { raw, computed: raw.trim() === 'true', type };
  }

  if (type === 'string') {
    return { raw, computed: raw, type };
  }

  try {
    const expression = raw.slice(1).trim().toUpperCase();

    const sumMatch = expression.match(/^SUM\(([A-Z]+\d+:[A-Z]+\d+)\)$/);
    if (sumMatch?.[1]) {
      const values = getRangeValues(cells, sumMatch[1]);

      return {
        raw,
        computed: values.reduce((acc, value) => acc + value, 0),
        type,
      };
    }

    const averageMatch = expression.match(/^AVERAGE\(([A-Z]+\d+:[A-Z]+\d+)\)$/);
    if (averageMatch?.[1]) {
      const values = getRangeValues(cells, averageMatch[1]);
      const total = values.reduce((acc, value) => acc + value, 0);

      return {
        raw,
        computed: values.length ? total / values.length : 0,
        type,
      };
    }

    const safeExpression = expression.replace(/[A-Z]+\d+/g, (ref) => {
      return String(getCellNumber(cells, ref));
    });

    if (!/^[\d+\-*/().\s]+$/.test(safeExpression)) {
      throw new Error('Invalid formula');
    }

    const result = Function(`"use strict"; return (${safeExpression})`)();

    return {
      raw,
      computed: Number.isFinite(result) ? result : '#ERROR',
      type,
    };
  } catch {
    return {
      raw,
      computed: '#ERROR',
      type,
    };
  }
}

export function recomputeAllCells(cells: Record<string, CellData>): Record<string, CellData> {
  let next = { ...cells };

  for (let i = 0; i < 3; i++) {
    next = Object.fromEntries(
      Object.entries(next).map(([key, cell]) => [key, computeCell(cell.raw, next)]),
    );
  }

  return next;
}