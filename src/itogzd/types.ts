export type CellValueType = 'string' | 'number' | 'boolean' | 'formula' | 'empty';

export type CellData = {
  raw: string;
  computed: string | number | boolean;
  type: CellValueType;
};

export type CellPosition = {
  row: number;
  col: number;
};

export type SelectionRange = {
  start: CellPosition;
  end: CellPosition;
};

export type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  row: number;
  col: number;
  target: 'cell' | 'row' | 'col';
};