import { useSyncExternalStore } from 'react';
import type { CellData, CellPosition } from './types';
import { getCellKey } from './cellUtils';
import { computeCell, recomputeAllCells } from './formulaEngine';

type Store = {
  cells: Record<string, CellData>;
  activeCell: CellPosition;
  formulaValue: string;
  editingCell: CellPosition | null;

  setActiveCell: (position: CellPosition) => void;
  setFormulaValue: (value: string) => void;
  setEditingCell: (position: CellPosition | null) => void;
  setCellRaw: (row: number, col: number, raw: string) => void;
};

let state: Store;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(updater: (state: Store) => Partial<Store>) {
  state = {
    ...state,
    ...updater(state),
  };

  emit();
}

state = {
  cells: {},
  activeCell: { row: 0, col: 0 },
  formulaValue: '',
  editingCell: null,

  setActiveCell(position) {
    setState((current) => {
      const cell = current.cells[getCellKey(position.row, position.col)];

      return {
        activeCell: position,
        formulaValue: cell?.raw ?? '',
      };
    });
  },

  setFormulaValue(value) {
    setState((current) => {
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

  setEditingCell(position) {
    setState(() => ({
      editingCell: position,
    }));
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
        formulaValue:
          current.activeCell.row === row && current.activeCell.col === col
            ? raw
            : current.formulaValue,
      };
    });
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